const monthNamesET = ["jaanuar", "veebruar", "märts", "aprill", "mai", "juuni", "juuli", "august", "september", "oktoober", "november", "detsember"];
const monthNamesEN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const dateENformatted= function(){
	let timeNow = new Date();
	//return timeNow.getDate() + "." + (timeNow.getMonth() + 1) + "." + timeNow.getFullYear();
	return monthNamesEN[timeNow.getMonth()] + " " + timeNow.getDate() + " " + timeNow.getFullYear();
}

const dateENShort = function(){
	let timeNow = new Date();
	return (timeNow.getMonth() + 1) + "/" + timeNow.getDate() + "/" + timeNow.getFullYear();
}

const timeENformatted = function(){
	let timeNow = new Date();
	return timeNow.getHours() + ":" + timeNow.getMinutes() + ":" + timeNow.getSeconds();
}

const dateETformatted = function(){
	let timeNow = new Date();
	return timeNow.getDate() + ". " + monthNamesET[timeNow.getMonth()] + " " + timeNow.getFullYear();
}

const timeETformatted = function(){
	let timeNow = new Date();
	return timeNow.getHours() + ":" + timeNow.getMinutes() + ":" + timeNow.getSeconds();
}

const timeOfDayET = function(){
	let partOfDay = "suvaline hetk";
	let hourNow = new Date().getHours();
	if(hourNow >= 6 && hourNow < 12){
		partOfDay = "hommik";
	}
	if(hourNow > 14 && hourNow < 18){
		partOfDay = "pärastlõuna";
	}
	if(hourNow >= 18){
		partOfDay = "õhtu";
	}
	return partOfDay;
}

const convertDateFormat = function(date, format){
    let dateParts = date.split('/');
    let month = parseInt(dateParts[0]);
    let day = parseInt(dateParts[1]);
    let year = parseInt(dateParts[2]);

    if (format === "ET"){
        return day + "." + month + "." + year;
    } else if (format === "EN"){
        return month + " " + day + " " + year;
    } else if (format === "EN_SHORT"){
        return month + "/" + day + "/" + year;
    }
};

//ekspordin kõik asjad
module.exports = {dateETformatted: dateETformatted, timeETformatted: timeETformatted, monthsET: monthNamesET, timeOfDayET: timeOfDayET, dateENformatted: dateENformatted, dateENShort: dateENShort, timeENformatted: timeENformatted, monthsEN: monthNamesEN, convertDate: convertDateFormat};