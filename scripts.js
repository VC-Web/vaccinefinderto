// Areas identified by the Govt. of Ontario

const priorityAreas = [ 'M1B', 'M1C', 'M1E', 'M1G', 'M1H', 'M1J', 'M1K', 'M1M', 'M1P', 'M1R', 'M1X', 'M2J', 'M2M', 'M2R', 'M3A', 'M3C', 'M3H', 'M4A', 'M3J', 'M3K', 'M3L', 'M3M', 'M3N', 'M6B', 'M6L', 'M6M', 'M9L', 'M9M', 'M9N', 'M9P', 'M4X', 'M5A', 'M5B', 'M5N', 'M6A', 'M5V', 'M6E', 'M6H', 'M6K', 'M6N', 'M8V', 'M9A', 'M9B', 'M9C', 'M9R', 'M9V', 'M9W', 'M1L', 'M4H', 'M1S', 'M1T', 'M1V', 'M1W' ]


// Function to get URL parameters

getParams = function (url) {
	var params = {};
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};

// function to fill and submit form based on URL parameters
// 
paramsFormFill = function() {
  let params = getParams(window.location.href);
  console.log(params);
//   console.log(params.age);
//   console.log(params.postalcode);

  if ( params.age) {
    let yourAge = params.age;
    yourAge = 2021 - yourAge;
    $("#age").val(yourAge);  
  }

  if ( params.postalcode) {
    $("#address").val(params.postalcode);
  }
  
  if (params.postalcode || params.age) {
    $('#form').submit();
  }
}

// Function to find the distance between two places on earth for showing distances on cards
// 
getDistance = function(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

deg2rad = function(deg) {
  return deg * (Math.PI/180)
}

// Function to sort the vaccine location DB

buildTile = function (data, lat, long) {
  //   All the data points I need
  let address = data.address;
  let name = data.locationname;
  let type = data.locationtype;
  let phone = data.phone;
  let website = data.website;
  let thisLat = data.location.lat;
  let thisLong = data.location.long;
  let div = document.createElement('div');
  //   build a listing div
  div.classList.add('listing');
  //   Build a name p
  let nameP = document.createElement("P");               // Create a <p> element
  nameP.innerText = name;               // Insert text
  div.append(nameP);
  let innerDiv = document.createElement('div');
  div.append(innerDiv);
  //   build a listing div
  innerDiv.classList.add('addressDistance');
  //   Build a type p
  let typeP = document.createElement("P");
  typeP.innerText = type;
  typeP.classList.add('type');
  innerDiv.append(typeP);
    //   if users location is known, find the distance from their location to vaccine clinic location
  if ( lat !== undefined ) {
    let distanceP = document.createElement("P");
    distanceP.innerText = Math.round((getDistance(lat, long, thisLat, thisLong) + Number.EPSILON) * 100) / 100 + "KM";
    distanceP.classList.add('distance');
    innerDiv.append(distanceP);
  }
  //   build an address p
  let addressP = document.createElement("A");
  addressP.innerText = address;
  addressP.setAttribute('href', "https://www.google.com/maps/search/?api=1&query=" + thisLat + "," + thisLong);
  div.append(addressP);
  //   if there's a link to a website, include it
  if ( website !== undefined) {
      let webLink = document.createElement("A");
      webLink.setAttribute('href', website);
      webLink.innerText = website;
      div.append(webLink);
    }
  
  if ( phone !== undefined) {
      let phoneLink = document.createElement("A");
      phoneLink.setAttribute('href', "tel:" + phone);
      phoneLink.innerText = phone;
      div.append(phoneLink);
    }
    $('.listingContainer').append(div);    
};

sortByLocation = function(latitude, longitude, filter) {
    $.ajax({
    url: "https://api.hubapi.com/cms/v3/hubdb/tables/3958668/rows",
    data: {
        hapikey: "f8ea6745-ac26-4574-87c5-ef133dccb31a",
        sort: "geo_distance(location," + latitude + "," + longitude + ")",
        locationtype__icontains: filter
    },
    error: function () {
      console.log("error");
    }, 
    success: function (xml) {
      $('.listingContainer').empty();  // empty the container
      $("#loading").hide(); // hide the loading message
      $.each(xml.results, function(){
        buildTile(this.values, latitude, longitude); // build the results
      })
    }
  });
}

// Initial listings call without location info
getListings = function() {
    $.ajax({
    url: "https://api.hubapi.com/cms/v3/hubdb/tables/3958668/rows",
    data: {
        hapikey: "f8ea6745-ac26-4574-87c5-ef133dccb31a",
    },
    error: function () {
      console.log("error");
    }, 
    success: function (xml) {
      $('.listingContainer').empty();  // empty the container
      $("#loading").hide();
      $.each(xml.results, function(){
        buildTile(this.values);
      })
    }
  });
}

// **** Not currently in use *****
// findMyLocation = function() {
//   $('.listingContainer').empty();  // empty the container
//   $("#loading").show();
//   navigator.geolocation.getCurrentPosition(function(position) {
//   let lat = position.coords.latitude;
//   let long = position.coords.longitude;
//   sortByLocation(lat,long);
// })
// };

$('#form').submit(function(e) {
  e.preventDefault();
  $('.listingContainer').empty();  // empty the listings container
  $("#loading").show(); // show the loading message
  
//   Get the values from the form
  let address = $("#address").val();
  let area = address.substring(0,3).toUpperCase(); // gets the first three digits of postal code to check against prio
  let age = $("#age").val();
  let filter = "";
  age = 2021 - age;
  console.log(age);
  if ( priorityAreas.includes(area) ) { // you live in a priority area
    $(".eligibility").html("You're in a priority area and might be Eligible");
  } else if ( priorityAreas.includes(area) && age >= 55 && age < 60) { // priority + 
    $(".eligibility").html("You're in a priority area and are old enough. You might be Eligible");
  } else if ( age >= 55 && age < 60) { 
    $(".eligibility").html("You're eligible for a pharmacy site");
    let filter = "pharmacy"
  } else if ( age >= 60) { 
    $(".eligibility").html("You're eligible for a vaccine");
  } else {
    $(".eligibility").html("You're area isn't priority and you are too young");
  }

  $.ajax({
    url: "https://api.positionstack.com/v1/forward",
    data: {
      access_key: '41358148675774d3acd056f25705ea8a',
      query: address,
      limit: 1
    },
    error: function () {
      console.log("error");
    }, 
    success: function (data) {
      let lat = data.data[0].latitude;
      let long = data.data[0].longitude;
      $('.listingContainer').empty();  // empty the container
      $("#loading").hide();
      sortByLocation(lat,long, filter);
    }
  });
});


getListings();
paramsFormFill();