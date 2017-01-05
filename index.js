xml2js = require('xml2js')
request = require('request')

var prefix = "http://courses.illinois.edu/cisapp/explorer/schedule/2017/Spring/";

data = require('./info.js')


function newSchedule(){
	var ret = new Object();
	ret.mon = [];
	ret.tue = [];
	ret.wed = [];
	ret.thu = [];
	ret.fri = [];
	return ret;
}
function getData(data, times, courseIDX, crnIDX){
	if(data.length == courseIDX){
		// Done, continue to the next part
		var possibleSchedules = startSchedule(data, times, 0, []);
		console.log(possibleSchedules.length);
		printSchedules(possibleSchedules);
		return;
	}
	var course = data[courseIDX]
	if(crnIDX== 0){
		// First CRN of this course, create new 2-D array
		times[courseIDX] = new Array(course.Sections.length);
	}
	var url = prefix + course.Department + "/" + course.Class + "/" + course.Sections[crnIDX] + ".xml";
	request(url, function(error, response, body){
		xml2js.parseString(body, function(err, result){
			var sections = (result["ns2:section"].meetings[0].meeting[0]);
			var timeObj = { };
			timeObj.start = sections.start[0];
			timeObj.end   = sections.end[0];
			timeObj.dotw  = sections.daysOfTheWeek[0].trim();
			timeObj.crn = result['ns2:section']['$'].id
			times[courseIDX][crnIDX] = timeObj;
			if(crnIDX+1 == course.Sections.length){
				getData(data, times, courseIDX+1, 0);
			} else {
				getData(data, times, courseIDX, crnIDX+1);
			}
		});
	});
}

function startSchedule(data, times, courseIDX, scheduleSoFar){
	//console.log("courseIDX: " + courseIDX);
	if(courseIDX == times.length){
		// No more classes to schedule recursively
		return [scheduleSoFar];
	}
	var retSchedules = [];
	for(var crnIDX = 0; crnIDX < times[courseIDX].length; crnIDX++){
		var tempSchedule = scheduleSoFar.slice();
		//console.log("CRN:" + data[courseIDX].Sections[crnIDX]);
		tempSchedule.push(times[courseIDX][crnIDX]);
		if(conflict(tempSchedule)){
			console.log("Conflict found");
			continue;
		}
		var  newSchedules = startSchedule(data, times, courseIDX+1, tempSchedule);
		retSchedules = retSchedules.concat(newSchedules);
		console.log("****************");
	}
	return retSchedules;
}

/**
 * Given an array of CRNs, return true if any two overlap
 */
function conflict(schedule){
	if(schedule.length < 2){
		return false;
	}
	for(var i = 0; i < schedule.length; i++){
		for(var j = i+1; j < schedule.length; j++){
			if(overlap(schedule[i], schedule[j])){
				console.log("Schedule overlaps");
				return true;
			}
		}
	}
	return false;
}


function overlap(crnA, crnB){
	// If they are not on the same day, they do not overlap
	aArray = crnA.dotw.split("");
	bArray = crnB.dotw.split("");
	var intersect = aArray.filter(function (e) { return (bArray.indexOf(e) !== -1); });
	if(intersect.length == 0){
		return false;
	}
	var ab = before(crnA.end, crnB.start);
	var ba = before(crnB.end,crnA.start);
	return !( before(crnA.end, crnB.start)  || before(crnB.end, crnA.start));

}

/**
 * Returns true if timeA is before timeB
 */
function before(timeA, timeB){
	var numA = parseInt(timeA.substring(0,2));
	numA+=(timeA[6] == 'P' && (numA != 12) ? 12 : 0);
	numA+=(parseInt(timeA.substring(3,5)))/60.;
	var numB = parseInt(timeB.substring(0,2));
	numB+=(timeB[6] == 'P' && (numB != 12) ? 12 : 0);
	numB+=(parseInt(timeB.substring(3,5)))/60.;
	return (numA < numB);
}

function printSchedules(possibleSchedules){
	console.log(possibleSchedules);
}

var times = new Array(data.classes.length);
getData(data.classes, times, 0, 0);

