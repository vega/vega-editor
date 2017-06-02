module['exports'] = function myService (hook) { 
  
  var github = require('octonode');
 
  var filename = hook.params.filename;
  var description = hook.params.description;
  var spec = hook.params.spec;

  var client = github.client();
  
  var files = {};
  
  files[filename] = {"content": spec};

  var ghgist = client.gist();

	 ghgist.create({
	   description: description,
	   files: files,
       public: true
	 }, function(err, g){
       if (err) {
         return hook.res.json(err);   
       }
       hook.res.json(g.files); 

     });
};