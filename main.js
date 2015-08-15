"use string"
require(['util', 'textarea'], function(Util) {
  var form = Util.query("form"),
      output = Util.query("#output"),
      btnSave = Util.query("#save"),
      take = Util.query("#take"),
      requests = [];
  read();
  if(requests.length) updateForm();
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    if(!isJsonString(form.json.value)) {
      alert("Invalid JSON");
      return;
    }
    var obj = JSON.parse(form.json.value);
    console.log(obj);
    Util.json(form.url.value, obj).then(function(result) {
      output.style.borderColor = "green";
      if(isJsonString(result))
        output.textContent = JSON.stringify(JSON.parse(result), null, 2);
      else
        output.textContent = result;
    }, function(error) {
      output.style.borderColor = "red";
      output.textContent = error.message;
    });
  });
  take.addEventListener('change', updateForm);
  btnSave.addEventListener('click', function() {
    var alias = prompt("Choose an alias");
    if(alias) save(alias, form.url.value, form.json.value);
  });
  function isJsonString(str) {
    try {
      JSON.parse(str);
      return true;
    } catch(_) {
      return false;
    }
  }
  function updateForm() {
    var taken = take.options[take.selectedIndex].value;
    var request = requests.reduce(function(acc, request) {
      return request.alias == taken ? request : acc;
    });
    form.url.value = request.url;
    form.json.value = request.json;
  }
  function save(alias, url, json) {
    var reqs = requests.filter(function(req) { return req.alias == alias; });
    if(reqs.length) {
      reqs[0].url = url;
      reqs[0].json = json;
    }
    else requests.push({alias: alias, url: url, json: json});
    localStorage.setItem('requests', JSON.stringify(requests));
    read();
    alert("Saved");
  }
  function read() {
    var s = localStorage.getItem('requests');
    if(s) requests = JSON.parse(s);
    take.innerHTML = "";
    requests.forEach(function(e) {
      take.appendChild(Util.elt('option', {value: e.alias}, e.alias));
    });
  }
});
