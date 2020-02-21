document.getElementById('submitTags').addEventListener('click',submitFilters);
document.getElementById('submitCreators').addEventListener('click',submitFilters);
function submitFilters() {
	var tags = document.getElementById('tags').value.replace(/,\s/g,',').replace(/\s/g,'_');
	var creators = document.getElementById('creators').value.replace(/,\s/g,',').replace(/\s/g,'_');
	var url = "../browse"
	if (creators.length > 0){
		url += '?creators='+creators;
		if (tags.length > 0){
			url += '&tags='+tags;
		}
		window.location.replace(url);
	}
	else if (tags.length > 0){
		url += '?tags='+tags;
		window.location.replace(url);
	}
	
}


minimizedBoxes = {};
minimizedBoxes.created = 'half';
minimizedBoxes.forked = 'half';
minimizedBoxes.edited = 'half';
minimizedBoxes.viewed = 'half';
function minimizeBox(type,full=false){
	var el = document.getElementById(type+'Box');
	var myStyle = el.querySelector('chartdn-chart').getAttribute('data-style');
	var loc = el.querySelector('chartdn-chart').getAttribute('data-loc');
	var chartid = el.querySelector('chartdn-chart').getAttribute('src');
	if (full){
		el.classList.add('pure-u-1-1');
		el.classList.remove('pure-u-1-2');
		el.style.display = 'block';
		minimizedBoxes[type] = 'full';
		var jsonmessage = {'operation':'view','id':chartid,'loc':loc,'style':myStyle};
		ws.send(JSON.stringify(jsonmessage));
		var el2 = document.getElementById(type+'None');
		el2.style.display = 'none';
	}
	else if (minimizedBoxes[type] == 'full') {
		el.classList.add('pure-u-1-2');
		el.classList.remove('pure-u-1-1');
		el.style.display = 'block';
		var jsonmessage = {'operation':'view','id':chartid,'loc':loc,'style':myStyle}
		ws.send(JSON.stringify(jsonmessage));
		minimizedBoxes[type] = 'half';
	}
	else if (minimizedBoxes[type] == 'half') {
		el.style.display = 'none';
		var el2 = document.getElementById(type+'None');
		el2.style.display = 'block';
		minimizedBoxes[type] = 'none';
	}
	else if (minimizedBoxes[type] == 'none') {
		el.classList.add('pure-u-1-2');
		el.classList.remove('pure-u-1-1');
		el.style.display = 'block';
		var jsonmessage = {'operation':'view','id':chartid,'loc':loc,'style':myStyle}
		ws.send(JSON.stringify(jsonmessage));
		minimizedBoxes[type] = 'half';
		var el2 = document.getElementById(type+'None');
		el2.style.display = 'none';
	}
	
}




