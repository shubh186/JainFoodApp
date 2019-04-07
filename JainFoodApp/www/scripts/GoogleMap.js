﻿"use strict"
var map, currentPositionMarker;
function initMap() {
    map = new google.maps.Map(
        document.getElementById('map'),
        {
            center: { lat: 41.84, lng: -39.08 },
            zoom: 3,
            disableDefaultUI: true,
            styles: [
                {
                    featureType: 'poi.business',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'poi.school',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'poi.sports_complex',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'poi.medical',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'poi.place_of_worship',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'transit',
                    elementType: 'labels.icon',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'road',
                    elementType: 'geometry',
                    stylers: [{ color: '#fafafa' }]
                },
                {
                    featureType: 'road',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#cc6c08' }]
                },
                {
                    featureType: 'road',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#9ca5b3' }]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'geometry',
                    stylers: [{ color: '#e5c4a0' }]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#fff2af' }]
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#9ca5b3' }]
                },
            ]
        });

    var input = document.getElementById('pac-input');

    var autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.bindTo('bounds', map);

    // Specify just the place data fields that you need.
    autocomplete.setFields(['place_id', 'geometry', 'name', 'formatted_address']);

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    var infowindow = new google.maps.InfoWindow;

    var infowindowContent = document.getElementById('infowindow-content');
    infowindow.setContent(infowindowContent);

    var geocoder = new google.maps.Geocoder;

    var marker = new google.maps.Marker({ map: map });
    marker.addListener('click', function () {
        infowindow.open(map, marker);
    });

    autocomplete.addListener('place_changed', function () {
        infowindow.close();
        var place = autocomplete.getPlace();

        if (!place.place_id) {
            return;
        }
        geocoder.geocode({ 'placeId': place.place_id }, function (results, status) {
            if (status !== 'OK') {
                return;
            }

            for (var i = 0; i < results[0].types.length; i++) {
                if (results[0].types[i] == "establishment" ||
                    results[0].types[i] == "food" ||
                    results[0].types[i] == "point_of_interest" ||
                    results[0].types[i] == "restaurant" ||
                    results[0].types[i] == "bakery" ||
                    results[0].types[i] == "cafe") {

                    map.setZoom(18);
                    map.setCenter(results[0].geometry.location);

                    // Set the position of the marker using the place ID and location.
                    marker.setPlace(
                        { placeId: place.place_id, location: results[0].geometry.location });

                    marker.setVisible(true);

                    infowindowContent.children['place-name'].textContent = place.name;
                    infowindowContent.children['place-address'].textContent =
                        results[0].formatted_address;

                    infowindow.open(map, marker);
                } else {
                    map.setZoom(13);
                    map.setCenter(results[0].geometry.location);
                }

            
            };
           
            
        });
    });
}
function locError(error) {
    // the current position could not be located
    alert("The current position could not be found!");
}

function setCurrentPosition(pos) {
    currentPositionMarker = new google.maps.Marker({
        map: map,
        position: new google.maps.LatLng(
            pos.coords.latitude,
            pos.coords.longitude
        ),
        title: "Current Position"
    });
    map.setCenter(new google.maps.LatLng(
        pos.coords.latitude,
        pos.coords.longitude
    ));
    map.setZoom(13);
}

function displayAndWatch(position) {
    // set current position
    setCurrentPosition(position);
    // watch position
    watchCurrentPosition();
}

function watchCurrentPosition() {
    var positionTimer = navigator.geolocation.watchPosition(
        function (position) {
            setMarkerPosition(
                currentPositionMarker,
                position
            );
        });
}

function setMarkerPosition(marker, position) {
    marker.setPosition(
        new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude)
    );
}

function initLocationProcedure() {
    initMap();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(displayAndWatch, locError);
    } else {
        console.log("Not supported");
    }
}