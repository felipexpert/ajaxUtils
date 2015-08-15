AJAX API Helper
======

<strong>Useful when you need to send a JSON and check out whether it is working properly.</strong>

<p>Place this JS utility inside your server, then insert the URL and the JSON ({} when you
   just need to test the url), and you will get the result from server</p>
<h2>Usage example</h2>
<p>Access <i>http://&lt;hostname&gt;/jsonUtils/</i> and do: </p>
<pre>
  URL: http://localhost/m/sale/canUseIdentifierAjax/1
  
  JSON: 
  {
    "identifier": "Felipe"
  }
  
  RESULT: 
  {
    "_status": "success",
    "canUseIdentifier": false
  }
</pre>
