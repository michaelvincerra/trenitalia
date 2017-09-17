/*
NOTE:  This file must be reduced to use only the contents of Geolocation.
*/




/**
 * Created by michaelevan on 6/2/17.
 */


"use strict";

// TODO:
// Create href to connect bus schedules to their locid.
// Create 'contentString' relative to the bus's locid.
// Integrate a Google street view into maps.

let map;    // set to global so that other functions can use the map object.
let stopMarkers =  new Array();      // empty array; set to global.

function paddy(number, padding, character) {
    // Pads any number or sting with the input char the number
    var pad_char = typeof character !== 'undefined' ? character : '0';
    var pad = new Array(1 + padding).join(pad_char);
    return (pad + number).slice(-pad.length);
}


function populateBus(index, bus) {
        // <tr>
        //   <th scope="row">1</th>
        //   <td>99</td>
        //   <td>42</td>
        //   <td>SW Corbett</td>
        // </tr>
        let busStopIndex = $('<th>', {'class':'row'}).text(index+1);
        let busLocID = $('<td>').text(bus.locid);
        let busStopDesc = $('<td>').text(bus.desc);
        let busHeading = $('<tr>').text(bus.dir);

        let busStopRow = $('<tr>').append(busStopIndex, busLocID, busHeading,busStopDesc);
        jQuery('#buses').append(busStopRow);
}


function makeInfoWindow(busStop, arrivals){
    // Generates an info window HTML to Google Map Marker objects.

    // $.each(busStops.resultSet, function(index, busStop) {   // $each(array, function)... works like enumerate
    //   let contentString = bus.location.locid;
    //   let $contentString = $('<div>').text(${contentString});

    let $description = $('<p>').text(`${busStop.desc}`);
    let $heading = $('<h4>').text(`${busStop.dir}`);
    let $body = $('<section>').append($heading, $description) ;
    // let $div = $('<div>').append(busStop.arrival.estimated);

    $.each(arrivals, function(index, arrival){

       //  if (typeof arrival.schedule === 'undefined'){   // VERSION 06/2017
       //      var utcSeconds = arrival.scheduled;
       //  } else if (!typeof arrival.estimated === 'undefined'){
       //      var utcSeconds = arrival.estimated;
       // }
       //  let date = new Date(0); // The 0 there is the key, which sets the date to the epoch
       //  date.setUTCSeconds(utcSeconds);

        // let scheduled = arrival.scheduled; // TODO: Complete revision of 'scheduled_time' below. 24.08.17

        let estimated = arrival.estimated;
        let scheduled = arrival.scheduled;

        let date = new Date(estimated);
        // let scheduled_time = new Date(scheduled);

        // let scheduled = new Date(scheduled);

        /*
        Use documentation here to change the date time object.
        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
         */

        let arrivalTime = $('<div>').text(`ETA: ${date}`);    // TODO: Solve for the correct time!!
        let route = $('<div>').text(`Route: ${arrival.route}`);
        let status = $('<div>').text(`Status: ${arrival.status}`);
        // let scheduled_time = $('<div>').text(`Scheduled: ${scheduled_time}`);

        let routeNum = paddy(arrival.route, 3, 0);

        let routeLink = $('<a>', {'href': `https://trimet.org/schedules/r${routeNum}.htm`,
                                   'class': 'routelink'});
        routeLink.text(`Link to route: ${routeNum}`);

        let infoGlyph = $('<i>', {'class': 'fa fa-bus'});

        let routeLinkBox = $('<p>').append(infoGlyph, routeLink);

        let arrivalMeta = $('<div>', {'class': "arrival"});
        arrivalMeta.append(arrivalTime, route, status, routeLinkBox,);   // scheduled_time, can be added here.

        $body.append(arrivalMeta);
    });

// Can you build a function that shows the current bus location en route?
//  See: https://developer.trimet.org/ws_docs/vehicle_locations_ws.shtml


    let $content = $('<main>').append($heading, $body);
    return $content.html();
}


function prepInfoWindow(busStop, arrivals, map, stopMarker){
    let contentString = makeInfoWindow(busStop, arrivals);

    let infowindow = new google.maps.InfoWindow({
            content: contentString
        });
    infowindow.open(map, stopMarker);

}



function fetchArrivals(locID, busStop, map, stopMarker){                // Web Services
    // Fetches vehicle arrival data for a single transit stop
    let request_params = {  'appID': '4E96154581EDC8C3DD6D5EB4A',
                            'json': 'true',
                            'locIDs': locID,
                            'minutes': '30',
                            'estimated': '3',
                            'arrivals': '2'
    };

    let ajax_options = {type: 'GET',    // if in doubt, try POST first.
                        data: request_params,
                        url: 'https://developer.trimet.org/ws/V1/arrivals'};    // Changed v2 to v1 in url.

    $.ajax(ajax_options).done(function(response) {          // Understand the shape of the data
        console.log(response);
        // let locID = response.resultSet.arrival.scheduled;   // 06.07.17  Restart here.  Is 'locID' the right variable to call?
        let arrivals = response.resultSet.arrival;  /// TODO: REVISE!!
        // let arrivals = response.resultSet.estimated;

        prepInfoWindow(busStop, arrivals, map, stopMarker);

    }).fail(function(error){
        console.log(error);
});
    // return locID
}


function addBusStopMarker(busStop) {

    let busStopLoc = new google.maps.LatLng(busStop.lat, busStop.lng);   // should this line be removed ?

    let iconBase = 'static/img/bus.png';
    let stopMarker = new google.maps.Marker({                           // JSON object. key:value pair
        position: busStopLoc,
        title: busStop.desc,
        icon: iconBase
    });

    stopMarker.addListener('click', function () {
        fetchArrivals(busStop.locid, busStop, map, stopMarker);
    });

    stopMarkers.push(stopMarker);   //  Push the stopMarker to the markers array ; 06.07.17
    stopMarker.setMap(map);         //  Add  the marker to the map, call setMap();
}


function addMapLinks(busses) {
    // Adds collection of buses to the map to the table.
    $.each(busses, function (index, busStop) {
        // console.log(index, bus);
        populateBus(index, busStop);
        addBusStopMarker(busStop);
    });
}


function fetcher(position, meters) {

    if (typeof meters === 'undefined'){
        let meters = '300';
    }

    let lat = position.coords.latitude;
    let long = position.coords.longitude;
    console.log(lat,long);

    let request_params = { 'appID': '4E96154581EDC8C3DD6D5EB4A',
                            'll': `${lat},${long}`,
                            'meters': meters,
                            'json': 'true' };
    $.ajax({
    url:'https://developer.trimet.org/ws/V1/stops',   //
    method: 'GET',
    data: request_params,
    success: function(rsp){
        console.log(rsp);
        let buses = rsp.resultSet.location;
        clearAll();
        addMapLinks(buses);
    },
    error: function(err){
        console.log(err);
    }
});
}


function initMap(position) {

    let here = {lat: position.coords.latitude, lng: position.coords.longitude};
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: here,
        // icon: icon
    });

    let marker = new google.maps.Marker({
        position: here,
        map: map
    });
}


function getPosition() {

    if ("geolocation" in navigator) {
     /* geolocation is available */
    console.log("Geolocation Enabled");

    navigator.geolocation.getCurrentPosition(function(pos) {
        let here = {lat: pos.coords.latitude, lng: pos.coords.longitude};
        console.log(here);
        initMap(pos);
        fetcher(pos);
        });
    } else {
      /* geolocation IS NOT available */
      console.log("Geolocation not enabled")
    }
}


/////////////////////////////////////////////////////////////////////////////////////  Clearing Logic

function setMapOnAll(map) {
    // Sets the map on all markers in the array.
    // See: https://developers.google.com/maps/documentation/javascript/examples/marker-remove
    $.each(stopMarkers, function(index, stopMarker) {
        stopMarker.setMap(map);
    });
}

function clearMarkers() {
    // Removes the markers from the map, but keeps them in the array.
    // See: https://developers.google.com/maps/documentation/javascript/examples/marker-remove
    setMapOnAll(null);
}

function showMarkers() {
    // Shows any markers currently in the array.
    // See: https://developers.google.com/maps/documentation/javascript/examples/marker-remove
    setMapOnAll(map);
}

function deleteMarkers() {
    // Deletes all markers in the array by removing references to them.
    clearMarkers();
    stopMarkers = [];
}

function clearTable() {
    $('#buses').empty();
    // clears records from table
    // addBusStopMarker(bus);
    // setMapOnAll(null);
}

function clearAll(){
    // clear markers on map
    clearMarkers();
    // clear the table
    clearTable();
}

/////////////////////////////////////////////////////////////////////////////////////


function updateStops(event, ui){
    console.log('Moved slider');

    navigator.geolocation.getCurrentPosition(function(position) {
        fetcher(position, ui.value);
    });
    // navigator.geolocation.getCurrentPosition(function(pos) {
    //     let loc = {lat: pos.coords.latitude, lng: pos.coords.longitude};
    //     let meters = ui.value;
    //     fetcher(loc, meters);
    // });


}

$(function () {
    let handle = $("#custom-handle");
    $("#slider").slider({
        min: 100,
        max: 1500,
        value: 100,
        step: 25,

        create: function () {
            handle.text($(this).slider("value"));
        },
        slide: function (event, ui) {
            handle.text(`${ui.value}m`);    // ui.value is the value of the current location.
        },
        stop: updateStops

    });
});



// 06.07.17: TEST
//     if () {
//         stopMarker.setMap(null);
//     } else {
//
//     }
//
// }

// 06.07.17: TEST
// stopMarker.addListener('click', function deleteMarkers() {
// clearMarkers();
// stopMarker = [];
//  });


// $('#sub_button').on('click', function(event){
//   // event handler for handling ...
//   event.preventDefault();
// });
