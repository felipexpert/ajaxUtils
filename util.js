"use strict";
define(function() {
  var Util = Object.create(null);

  Util.AssertionFailed = function(message) {
    this.message = message;
    this.stack = (new Error()).stack;
  }
  Util.AssertionFailed.prototype = Object.create(Error.prototype);

  Util.assert = function(test, message) {
    if(!test) throw new Util.AssertionFailed(message || 'Assertion failed!');
  }

  Util.toRealArray = function(array) {
    return Array.prototype.slice.call(array, 0);
  };

  Util.objToArray = function(obj, f) {
    var array = [];
    if(f) for(var k in obj)
      array.push(f(obj[k], k));
    else for(var k in obj)
      array.push(obj[k]);
    return array;
  }

  Util.woIndex = function(array, index) {
    return array.slice(0, index).concat(array.slice(index + 1));
  }

  Util.queryOver = function(element, tag, all) {
    if(all)
      return Util.toRealArray(element.querySelectorAll(tag));
    return element.querySelector(tag);
  };

  Util.query = function(tag, all) {
    return Util.queryOver(document, tag, all);
  };

  Util.elt = function(name, attributes) {
    var node = document.createElement(name);
    if(attributes) {
      for(var attrib in attributes)
        if(attributes.hasOwnProperty(attrib))
          node.setAttribute(attrib, attributes[attrib]);
    }
    var args = Util.toRealArray(arguments).slice(2);
    args.forEach(function(e) {
      Util.assert(e && e.nodeType || typeof e == 'string' || typeof e == 'number', "elt: Invalid element type")
      if(typeof e == "string" || typeof e == "number")
        e = document.createTextNode(e);
      node.appendChild(e);
    });
    return node;
  }

  Util.NetworkError = function(message) {
    this.message = message;
    this.stack = (new Error()).stack;
  }
  Util.NetworkError.prototype = Object.create(Error.prototype);
  Util.NetworkError.prototype.name = "NetworkError";
 
  Util.RequestError = function(message) {
    this.message = message;
    this.stack = (new Error()).stack;
  }
  Util.RequestError.prototype = Object.create(Error.prototype);
  Util.RequestError.prototype.name = "RequestError";

  Util.get = function(url) {
    return new Promise(function(succeed, fail) {
      var req = new XMLHttpRequest();
      req.open("GET", url, true);
      req.addEventListener("load", function() {
        if (req.status < 400)
          succeed && succeed(req.responseText);
        else
          fail && fail(new Util.RequestError("Request failed: " + req.statusText));
      });
      req.addEventListener("error", function() {
        fail && fail(new Util.NetworkError("Network error"));
      });
      req.send(null);
    });
  };

  Util.post = function(url, content) {
    return new Promise(function(succeed, fail) {
      var req = new XMLHttpRequest();
      req.open("POST", url, true);
      req.addEventListener("load", function() {
        if (req.status < 400)
          succeed && succeed(req.responseText);
        else
          fail && fail(new Util.RequestError("Request failed: " + req.statusText));
      });
      req.addEventListener("error", function() {
        fail && fail(new Util.NetworkError("Network error"));
      });
      req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
      req.send(content);
    });
  };

  Util.json = function(url, object) {
    var content = JSON.stringify(object);
    return new Promise(function(succeed, fail) {
      var req = new XMLHttpRequest();
      req.open("POST", url, true);
      req.addEventListener("load", function() {
        if (req.status < 400)
          succeed && succeed(req.responseText);
        else
          fail && fail(new Util.RequestError("Request failed: " + req.statusText));
      });
      req.addEventListener("error", function() {
        fail && fail(new Util.NetworkError("Network error"));
      });
      req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
      req.send(content);
    });
  };

  Util.tryAgain = function(method, url, run, content) {
    method(url, content).then(run, function(error) {
      console.log(error);
      tryAgain(method, url, run, content);
    });
  };

  Util.insertAfter = function(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  };

  Util.fireEvent = function(element, event) {
    if (document.createEvent) {
      // dispatch for firefox + others
      var evt = document.createEvent("HTMLEvents");
      evt.initEvent(event, true, true ); // event type,bubbling,cancelable
      return !element.dispatchEvent(evt);
    } else {
      // dispatch for IE
      var evt = document.createEventObject();
      return element.fireEvent('on'+event,evt)
    }
  };

  Util.capFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  Util.dateToText = function(date, format) {
    format = format.replace("YYYY", date.getFullYear())
    .replace("MM", padWith(date.getMonth() + 1, '0', 2))
    .replace("DD", padWith(date.getDate(), '0', 2))
    .replace("hh", padWith(date.getHours(), '0', 2))
    .replace("mm", padWith(date.getMinutes(), '0', 2))
    .replace("ss", padWith(date.getSeconds(), '0', 2))
    return format;
  };

  Util.padWith = function(text, character, length) {
    text = text + "";
    for(var pos = text.length; pos < length; pos++)
      text = character + text;
    return text;
  };

  /* inspired by https://gist.github.com/1129031 */
  /*global document, DOMParser*/
  (function(DOMParser) {
    var proto = DOMParser.prototype, 
        nativeParse = proto.parseFromString;

    // Firefox/Opera/IE throw errors on unsupported types
    try {
      // WebKit returns null on unsupported types
      if ((new DOMParser()).parseFromString("", "text/html")) {
        // text/html parsing is natively supported
        return;
      }
    } catch (ex) {}

    proto.parseFromString = function(markup, type) {
      if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
        var doc = document.implementation.createHTMLDocument("");
        if (markup.toLowerCase().indexOf('<!doctype') > -1) {
          doc.documentElement.innerHTML = markup;
        } else {
          doc.body.innerHTML = markup;
        }
        return doc;
      } else {
        return nativeParse.apply(this, arguments);
      }
    };
  }(DOMParser));

  (function() {
    var PositionHelper = function(element) {
      this.element = element;
    }
    PositionHelper.prototype.getBounds = function(isRelativeToWholeDocument) {
      var bounds = this.element.getBoundingClientRect();
      var result = { top: bounds.top, right: bounds.right, 
            bottom: bounds.bottom, left: bounds.left,
            height: bounds.bottom - bounds.top, width: bounds.right - bounds.left };
      if(isRelativeToWholeDocument) {
        result.top += pageYOffset;
        result.right += pageXOffset;
        result.bottom += pageYOffset;
        result.left += pageXOffset;
      }
      return result;
    }
    PositionHelper.prototype.getElement = function() {
      return this.element;
    }

    Util.PositionHelper = PositionHelper;
  })();
  
  Util.currencyToNumber = function(currency, d) {
    d = d == undefined ? "," : d;
    var number = "";
    for(var i = 0; i < currency.lengh; i++) {
      var c = currency[i];
      if(/\d/.test(c)) number += c;
      else if (c == d) number += '.';
    }
    return Number(number);
  };

  Util.currencyFormat = function(n, prefix, c, d, t) {
    prefix = prefix == undefined ? "R$" : prefix,
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "," : d, 
    t = t == undefined ? "." : t; 
    var s = n < 0 ? "-" : "", 
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
        j = (j = i.length) > 3 ? j % 3 : 0;
    return prefix + s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) 
         + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
  };

  Util.iterateTableRows = function(table, func, offset) {
   if(offset === undefined) offset = 1;
   for (var i = 0 + offset, row; row = table.rows[i]; i++) {
     //iterate through rows
     //rows would be accessed using the "row" variable assigned in the for loop
     var array = [];
     for (var j = 0, col; col = row.cells[j]; j++) {
       //iterate through columns
       //columns would be accessed using the "col" variable assigned in the for loop
       array.push(col);
     }
     func(array, i);  
   } 
  };

  Util.sortTableByColumn = function(table, columnIndex, criteria) {
    var rows = Util.queryOver(table, 'tbody tr', true);
    if(!rows.length) rows = Util.queryOver(table, 'tr', true);
    var parent = rows[0].parentNode;
    rows.forEach(function(r) {
      parent.removeChild(r);
    });
    rows.sort(function(a,b) {
      var columnA = a.cells[columnIndex].textContent,
          columnB = b.cells[columnIndex].textContent;
      if(criteria) return criteria(columnA, columnB);
      return columnA.localeCompare(columnB)
    });
    rows.forEach(function(r) {
      parent.appendChild(r);
    }); 
  };

  Util.getHeight = function() {
    var body = document.body,
        html = document.documentElement;
    return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, 
        html.offsetHeight);
  };
  Util.getWidth = function() {
    var body = document.body,
        html = document.documentElement;
    return Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, 
        html.offsetWidth);
  };
  var tabToEnter = true;
  Util.tabToEnter = function(wrapper) {
    Util.queryOver(wrapper, 'input, select', true).forEach(function(input, i, inputs) {
      input.addEventListener('keypress', function(event) { 
        if(event.which == 13) {
          if(tabToEnter) {
            inputs.filter(function(input) { 
              var isDisplayNone = input.style.display && input.style.display.toLowerCase() == 'none';
              return !isDisplayNone
                  && !input.readOnly 
                  && input.type != 'hidden' && input.type != 'submit'; 
            }).some(function(input2, i2, inputs2) {
              if(input2 === input) {
                var nextIndex = (i2 + 1) % inputs2.length;
                inputs2[nextIndex].select();
                if(!nextIndex) {
                  if(wrapper.tagName == "FORM")
                    Util.fireEvent(wrapper, 'submit');
                  if(wrapper.hasAttribute('data-focus')) {
                    Util.query(wrapper.getAttribute('data-focus')).select();
                    return true;
                  }
                }
              }
            });
            tabToEnter = false;
            setTimeout(function() { tabToEnter = true; }, 125);
          }
          event.preventDefault();
        }
      });
    });
  }; 
  Util.killCtrl = function(action) {
    return function(event) {
      if(event.ctrlKey) {
        action && action(event);
        if(event.keyCode != 82 && event.keyCode != 76)
          event.preventDefault();
      }
    }
  };
  Util.clamp = function(number, min, max) {
    return Math.max(min, Math.min(number, max));
  };
  Util.repeat = function(x, f, oneBased) {
    if(oneBased) for(var i = 1; i <= x; i++)
      f(i);
    else for(var i = 0; i < x; i++)
      f(i);
  };
  Util.produce = function(x, f, oneBased, array) {
    if(array) array = array.slice(0);
    else array = [];
    if(oneBased) for(var i = 1; i <= x; i++)
      array.push(f(i));
    else for(var i = 0; i < x; i++)
      array.push(f(i));
    return array;
  };
  Util.getUrlId = function() {
    var href = window.location.href;
    return href.slice(href.lastIndexOf('/') + 1).replace(/^d+/, "$&");
  };
  Util.eq = function(a, b) {
    return Math.abs(a - b) < 0.015625;
  };
  Util.le = function(a, b) {
    return Util.eq(a, b) || a < b;
  };
  Util.ge = function(a, b) {
    return Util.eq(a, b) || a > b;
  };
  Util.zero = function(a) {
    return Util.eq(a, 0) ? 0 : a;
  };
  return Util;
});
