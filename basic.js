"use strict";
define(['util', 'jquery'], function(Util, $) {
  var Basic = Object.create(null);

  //alert(lang.get('test', 'Felipe', '20'));
  if(typeof Promise === 'undefined' || !/firefox|chrome/i.test(navigator.userAgent)) 
    alert("Firefox or chrome"); 

  Basic.jsonForm = function(form, url, contentObject, success) {
    var method = Util.get;
    if(contentObject) method = Util.json;
    document.body.style.cursor = "progress";
    Basic.serverLoggerCommunication(method, [url, contentObject], "Search", function(text) { 
      var result = JSON.parse(text);
      if(result._status != 'success') alert(result._message || "Wrong Data");
      for(var key in result) {
        if(key.slice(0, 1) == '_') continue;
        form[key].value = result[key];
      }
      Basic.doNF(form);
      success && success(result);
      document.body.style.cursor = "";
    }, function(error) {
        console.log(error);
      document.body.style.cursor = "";
    }, true);
  };

  Basic.submitForm = function(form, success, error, complete, formDataFile) {
    var formData = new FormData(form);
    formDataFile && formData.append(formDataFile.getName(), formDataFile.getFile());
    $.ajax({
      url: form.action,
      type: form.method,
      data: formData,
      processData: false,
      contentType: false,
      success: function(data, textStatus, jqXHR) {
        if(typeof data.error === 'undefined') {
          // Success
          success && success(data + "");
        } else {
          // Server error
          error && error(data.error);
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        // Ajax problem
        error && error(textStatus);
      },
      complete: function(){
        // Done
        complete && complete();
      } 
    });
  };

  Basic.submitLogForm = function(event, form, success, fail, formDataFile) {
    event.preventDefault();
    var submitButton = Util.queryOver(form, 'input[type="submit"]');
    var node;
    Util.queryOver(form, 'div[log]', true).forEach(function(e) {
      e.parentNode.removeChild(e);
    });
    Util.insertAfter(node = Util.elt("div"), form.firstChild);
    node.setAttribute("log", "");
    if(submitButton) submitButton.disabled = true;
    var log = Util.queryOver(form, "[log]");
    document.body.style.cursor = "progress";
    Basic.submitForm(form, function(text) {
      try {
      var result = JSON.parse(text);
      result.success && !form.classList.contains('noReset') && form.reset();
      if(log) {
        if(result.success)
          log.setAttribute("log", "success");
        else
          log.setAttribute("log", "fail");
        log.innerHTML = result.message;
      }
      success && success(result, log);
      } catch(ex) {
        console.log("Result from server:", text);
        console.log("Exception:", ex);
      }
    }, function(error) {
      console.log("Error:", error);
      fail && fail(error);
    }, function() {
      document.body.style.cursor = "";
      if(submitButton) submitButton.disabled = false;
    }, formDataFile);
  };

  Basic.verifyPlaces = function() {
    var currUrl = location.href;
    var urls = Util.toRealArray(arguments).map(function(place) {
      return baseUrl + place;
    });
    return urls.some(function(url) { return currUrl.indexOf(url) != -1; });
  };

  (function() {
    Util.query('[name]', true).forEach(function(node) {
      var name = node.getAttribute('name');
      if(name)
        node.setAttribute('id', name);
    });
  })();

  // Ajax Form Automation
  (function() {
    var forms = Util.query('form.ajax', true);
    if(!forms) return;
    forms.forEach(function(form) {
      form.addEventListener("submit", function(event) {
        Basic.submitLogForm(event, form, function(result, log) {
          if(result.success) {
            var redirectTo = Util.queryOver(form, '#redirect');
            if(redirectTo) {
              var value = redirectTo.value.split(';');
              var url = value[0], pageName = value[1];
              log.textContent += ". Você será redirecionado para " + pageName + " em 2 segundos";
              setTimeout(function() {
                window.open(url, '_self');
              }, 2500);
            }
          }
        });
      });
    }); 
  })();
  
  Basic.NumberFormatGetter = function(name, form) {
    this.name = name;
    this.form = form;
  };
  Basic.NumberFormatGetter.prototype.facade = function() {
    return Util.queryOver(this.form || document.body, '[data-name="' + this.name + '"]');
  };
  Basic.NumberFormatGetter.prototype.real = function() {
    return Util.queryOver(this.form || document.body, '[name="' + this.name + '"]')
  };
  
  Util.query('span.numberToMoney', true).forEach(function(span) {
    span.textContent =  Basic.numberToMoney(span.textContent);
  });


  Basic.arrangeTables = function() {
    Util.query('table.scroll', true).forEach(function(table) {
      var tableWidth = new Util.PositionHelper(table).getBounds().width - 52;
      var thArray = Util.queryOver(table, 'th', true);
      thArray.forEach(function(th, index) {
        var customWidth = th.getAttribute('data-width');
        if(customWidth) {
          th.style.width = customWidth / 100 * tableWidth + "px";
        } else {
          var x = tableWidth / thArray.length;
          var y = 0;
          if(table.rows[1]) {
            Util.toRealArray(table.rows[1].cells).some(function(cell, i) {
              if(index == i) {
                y = new Util.PositionHelper(cell).getBounds().width;
                return true;
              }
            });
          }
          th.style.width = Math.max(x, y) + "px";
        }
        var thBounds = new Util.PositionHelper(th).getBounds();
        var width = thBounds.width;
        Util.iterateTableRows(table, function(row) {  
          row.some(function(td, i) { 
            if(index == i) {
              td.style.width = width + "px";
              return true;
            }
          });
        });
      });
    });
  };
  Basic.arrangeTables();

  Basic.Toast = function(text, type, time) {
    this.text = text;
    this.type = type;
    this.time = time;
  }
  Basic.Toast.toasts = [];
  Basic.Toast.arrangeItems = function() {
    var height = document.body.clientHeight,
        offset = 0,
        margin = height / 64;
    Basic.Toast.toasts.forEach(function(toast) {
      toast.toast.style.bottom = offset + margin + "px";
      offset += toast.toastHeight + margin;
    });
  };
  Basic.Toast.prototype.show = function() {
    var toast = Util.elt('div', {class: this.getClass()}, this.text);
    toast.style.position = 'fixed';
    toast.style.zIndex = 300;
    document.body.appendChild(toast);
    var helper = new Util.PositionHelper(toast);
    var bounds = helper.getBounds();
    var width = document.body.clientWidth;
    toast.style.left = width / 2 - bounds.width / 2 + "px";
    setTimeout(function() { 
      toast.parentNode.removeChild(toast); 
      Basic.Toast.toasts = Util.woIndex(Basic.Toast.toasts, Basic.Toast.toasts.indexOf(this));
      Basic.Toast.arrangeItems();
    }.bind(this), this.time);
    this.toast = toast;
    this.toastHeight = bounds.height;
    Basic.Toast.toasts.push(this);
    Basic.Toast.arrangeItems();
  }
  /* success, info, warning and danger */
  Basic.Toast.prototype.getClass = function() {
    return 'alert alert-' + this.type;
  }
  Basic.Toast.LONG     = 5000;
  Basic.Toast.NORMAL   = 2500;

  Basic.json = function(url, object, task, success, fail, nonSuccessMessage) {
    Basic.serverLoggerCommunication(Util.json, [url, object], task, success, fail, nonSuccessMessage);
  };

  Basic.get = function(url, task, success, fail, nonSuccessMessage) {
    Basic.serverLoggerCommunication(Util.get, [url], task, success, fail, nonSuccessMessage);
  };

  Basic.serverLoggerCommunication = function(method, args, task, success, fail, nonSuccessMessage) {
    var t;
    var late = setTimeout(function() { 
      t = new Basic.Toast(task + " - Long time", "info", Basic.Toast.NORMAL);
      t.show();
    }, 2000);
    method.apply(null, args).then(function(result) {
      clearTimeout(late);
      success && success(result);
      if(!nonSuccessMessage) {
        t = new Basic.Toast(task + " - Success", "success", Basic.Toast.NORMAL);
        t.show();
      }
    }, function(error) {
      clearTimeout(late);
      fail && fail(error);
      if(error instanceof Util.RequestError) {
        t = new Basic.Toast(tast + " - Server Error", "warning", Basic.Toast.LONG);
        t.show();
      } else if(error instanceof Util.NetworkError) {
        t = new Basic.Toast(tast + " - Network Error", "danger", Basic.Toast.LONG);
        t.show();
      }
    });
  };

  return Basic;
});
