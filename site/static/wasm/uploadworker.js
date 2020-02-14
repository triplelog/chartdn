var Module = {
		preRun: [],
		postRun: [],
		setStatus: function(text) {
		  if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
		  if (text === Module.setStatus.last.text) return;
		  var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
		  var now = Date.now();
		  if (m && now - Module.setStatus.last.time < 30) return; // if this is a progress update, skip it if too soon
		  Module.setStatus.last.time = now;
		  Module.setStatus.last.text = text;
		  if (m) {
			text = m[1];
		  } else {
		  }
		},
		totalDependencies: 0,
		monitorRunDependencies: function(left) {
		  this.totalDependencies = Math.max(this.totalDependencies, left);
		  Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
		}
};
Module.setStatus('Downloading...');
//importScripts('datatype.js');
importScripts('../js/papaparse.min.js');

self.addEventListener('message', function(e) {
    var data=e.data;
    
	
    try {
        var readerP = new FileReader();
	
		readerP.onload = function() {

			console.log("Compressing")
			
			
			var partBufferH = this.result,
				partarrayH = new Uint8Array(partBufferH)
				
				
			//var arrayBuffer = this.result,
			//array = new Uint8Array(arrayBuffer)

			var fullstr = flate.deflate_encode_raw(partarrayH)
		
			//var fullstr = new TextDecoder("utf-8").decode(partarrayH);
			

			var parsedstr = Papa.parse(fullstr);
			
			//var get_type = Module.cwrap('getType', 'string', ['string']);
			
			var ctypestr = "-1";
			/*
			var ctypestr = "-1";
			for (var i=0; i<parsedstr[1].length; i++ ) {
				ctypestr += ",";
				var isdata = 0; var isstring = 0;
				for (var ii=1; ii<parsedstr.length; ii++ ) {
					if (i<parsedstr[ii].length){
						var dtype = get_type(parsedstr[ii][i].substring(0,19));
						if (dtype == "string") {
							isstring++;
						}
						else {
							isdata++;
						}
					}
				}
				if (isdata > isstring * 2) {
					ctypestr += '1';
				}
				else {
					ctypestr += '0';
				}
			}
			*/
			
			postMessage({
				result: fullstr,
				ctypestr: ctypestr
			});
		
		}
		readerP.readAsArrayBuffer(data);

   } catch(e){
        postMessage({
            result:'error'
        });
   }
}, false);





