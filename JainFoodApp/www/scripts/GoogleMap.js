﻿"use strict"
let map, currentPositionMarker, csvObjects;
let allMarkers = [];
let selectedCategores = [];
let filters = {};
const FILTER_TYPE_CATEGORIES = 'category';
const FILTER_TYPE_RESTAURANT_NAME = 'map_view_restaurant_name';

// UI classes for jquery selectors
const CLASS_MAP_VIEW_SEARCH_BAR = '.map-view-search-bar';
const CLASS_LIST_VIEW_SEARCH_BAR = '.list-view-search-bar';

function manageFilter(filterCategory, filterValues) {
	filters[filterCategory] = filterValues;
}

function getCategoryFilterArray() {
	return filters[FILTER_TYPE_CATEGORIES];
}

function getSearchBarFilter() {
	return filters[FILTER_TYPE_RESTAURANT_NAME];
}

function initFilters() {
	filters[FILTER_TYPE_CATEGORIES] = [];
	filters[FILTER_TYPE_RESTAURANT_NAME] = '';
}
function initMap() {
    map = new google.maps.Map(
        document.getElementById('map'),
        {
            center: { lat: 43.7184038, lng: -79.5181442 },
            zoom: 9,
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
        }
    );
}
function locError(error) {
    // the current position could not be located
    console.log("The current position could not be found!");
}

function setCurrentPosition(pos) {
    currentPositionMarker = new google.maps.Marker({
        map: map,
        position: new google.maps.LatLng(
            pos.coords.latitude,
            pos.coords.longitude
        ),
        title: "Current Position",
        icon: 'images/user-icon.png'
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
                position.coords.latitude,
                position.coords.longitude
            );
        });
}

function setMarkerPosition(marker, latitude, longitude) {
    marker.setPosition(
        new google.maps.LatLng(
            latitude,
            longitude)
    );
}

function getCuisines(restaurantsArray) {
    var cuisineTypes = [];
    for (var i = 0; i < restaurantsArray.length; i++) {
        if (restaurantsArray[i].Cuisine !== 'Other' || restaurantsArray[i].Cuisine !== ' ') {
            cuisineTypes.push(restaurantsArray[i].Cuisine.trim())
        }
    }

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    return cuisineTypes.filter(onlyUnique);
}

function popup(restaurantsArray) {
    var popupDiv = document.getElementById('popoverItems');
    var cuisines = getCuisines(restaurantsArray);
    var popupText = '';

    popupText += '<ons-list>'
    cuisines.forEach(function (element) {
        popupText += '<ons-list-item><div class="center">' + element + '</div><div class="right"><ons-switch input-id=' + element.replace(/ /g, '') + '></ons-switch></div></ons-list-item>';
    });
    popupText += '</ons-list>';

    popupDiv.innerHTML = popupText;

    $('ons-switch').on('change', function (event) {
        if (event.target.checked) {
			selectedCategores.push(event.target.attributes[0].value);         
        } else {
            var index = selectedCategores.indexOf(event.target.attributes[0].value);

            if (index > -1) {
                selectedCategores.splice(index, 1);
            }
		};
		manageFilter(FILTER_TYPE_CATEGORIES, selectedCategores);
		applyFilters();
    });
}

function applyFilters() {
	if (isFiltersClear()) {
		showAllRestaurants();
		return;
	}
	showAllMarkers(false);
	// now start applying each filter here on the Map View page
	filterByCategory(filters[FILTER_TYPE_CATEGORIES]);
	filterMarkersByRestaurantName(filters[FILTER_TYPE_RESTAURANT_NAME]);

	// apply filters to the List View Page
	filterListViewPage();
}

function showAllRestaurants() {
	populateAllMarkers();
	showListView(csvObjects);
}
/**
 * Filter List View page depending on the filter being set currently
 *
 */
function filterListViewPage() {
	let filteredRestaurants = csvObjects;
	const categoryArray = getCategoryFilterArray();
	const restaurantName = getSearchBarFilter();

	if (!filteredRestaurants) {
		return;
	}

	filteredRestaurants = filteredRestaurants.filter(function (restaurant) {
		let canFilter = false;

		// cuisine filter
		if (categoryArray && categoryArray.length > 0) {
			canFilter = categoryArray.includes(restaurant['Cuisine'].replace(/ /g, ''));
		}

		// restaurant name filter
		const currentName = restaurant['Name of Restaurant'];
		if (restaurantName !== '') {
			canFilter = canFilter || (currentName.toLowerCase().indexOf(restaurantName.toLowerCase()) >= 0);
		}
		return canFilter;
	});
	
	showListView(filteredRestaurants);
}

function filterListViewPageByRestaurantName(name) {
    map.setZoom(9);
    manageFilter(FILTER_TYPE_RESTAURANT_NAME, name);
	setMapViewSearchBarValue(name);
	setListViewSearchBarValue(name);
	applyFilters();
}

function filterByCategory(categoryArray) {
	if (!categoryArray) {
		return;
	}
    for (var i = 0; i < categoryArray.length; i++) {
        filterMarkers(categoryArray[i]);
    }
}

function showAllMarkers(visibility) {
    for (var i = 0; i < allMarkers.length; i++) {
        var marker = allMarkers[i];
        marker.setVisible(visibility);
    }
}

function filterMarkers(category) {
    for (var i = 0; i < allMarkers.length; i++) {
        var marker = allMarkers[i];

        if (marker.category == category || category.length === 0) {
            marker.setVisible(true);
        }
    }
}

function filterByRestaurantName(name) {
    filters[FILTER_TYPE_RESTAURANT_NAME] = name;
    map.setZoom(9);
	setListViewSearchBarValue(name);
	setMapViewSearchBarValue(name);
	applyFilters();
}

function isFiltersClear() {
	return (!getCategoryFilterArray() || getCategoryFilterArray().length === 0) && getSearchBarFilter() === '';
}

function setMapViewSearchBarValue(name) {
	const mapViewSearchBar = $(CLASS_MAP_VIEW_SEARCH_BAR);
	if (mapViewSearchBar && mapViewSearchBar.length > 0) {
		mapViewSearchBar[0].value = name;
	}
}

function setListViewSearchBarValue(name) {
	const listViewSearchBar = $(CLASS_LIST_VIEW_SEARCH_BAR);
	if (listViewSearchBar && listViewSearchBar.length > 0) {
		listViewSearchBar[0].value = name;
	}
}

function filterMarkersByRestaurantName(name) {
	if (!name || name.length === 0) {
		// the search bar filter doesn't need to be applied if it's just empty
		return;
	}
	for (var i = 0; i < allMarkers.length; i++) {
		var marker = allMarkers[i];

		if (marker.restaurantName.toLowerCase().indexOf(name.toLowerCase()) >= 0 || name.length === 0) {
			marker.setVisible(true);
		}
	}
}

function getSpreadsheetData() {
    $.ajax({
        type: "GET",
        url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSb0HkEoSOho1gBswbRzAZVqxl1oZVQe5ogMw65Pt-r5-gqJwfAGlwdB0uRzqOAae8morikFlNriObg/pub?output=csv",
        dataType: "text",
        success: function (data) {
			initRestaurants(data);
        },
        error: function () {
			alert("The app's full features are not available at this moment. Please ensure you are connected to the internet and try again in a few minutes.")
			initRestaurants({});
        }
    });
}
function callNumber(num) {
	cordova.InAppBrowser.open('tel:' + num, '_system');
}

function populateAllMarkers() {
    var infowindow = new google.maps.InfoWindow();

	for (var i = 0; i < csvObjects.length; i++) {

		var marker = new google.maps.Marker({
			map: map,
			position: new google.maps.LatLng(
				csvObjects[i].Latitude,
				csvObjects[i].Longitude
			),
			title: "Current Position",
			category: csvObjects[i].Cuisine.replace(/ /g, ''),
			restaurantName: csvObjects[i]['Name of Restaurant']
		});

		allMarkers.push(marker);
        google.maps.event.addListener(marker, 'click', (function (marker, i) {

            return function () {
                $('.search-bar input').blur();
				infowindow.setContent(
					'<div id="content" class="container">' +
					'<h4>' + csvObjects[i]["Name of Restaurant"] + '</h4>' +
					'<p><span class="green-color">Cuisine Type:</span> ' + csvObjects[i]["Cuisine"] + '</p>' +
					'<p><span class="green-color">Hours of Operation:</span> ' + csvObjects[i]["Hours of Operation"] + '</p>' +
					'<p><span class="green-color">Rating:</span> ' + csvObjects[i]["Google Rating"] + '</p>' +
					'<p><span class="green-color">Fully Vegetarian?:</span> ' + csvObjects[i]["Fully Veg/Not"] + '</p>' +
                    '<p class="number-link" onclick="callNumber(' + csvObjects[i]["Phone Number"].replace(/[- )(]/g, '') + ');"><span class="green-color">Phone Number:</span> ' + csvObjects[i]["Phone Number"] + '</p>' +
					'<p><span class="green-color">Price:</span> ' + csvObjects[i]["Price"] + '</p>' +
					'<div class="more-details">' +
					'<a id="details-accordion' + i + '" class="accordion-btn">More Details</a>' +
					'</div>' +
					'<div class="row">' +
					'<div id="details-accordion' + i + '" class="accordion">' +
					'<p><span class="green-color">Menu Items:</span> ' + csvObjects[i]["Menu Items"] + '</p>' +
					'<p><span class="green-color">Notes (what to ask Chef/Waiter):</span> ' + csvObjects[i]["Notes (what to ask Chef/Waiter)"] + '</p>' +
					'</div>' +
					'</div>' +
					'</div>'
				);
                infowindow.open(map, marker);
			}
        })(marker, i));

        google.maps.event.addListener(map, "click", function (event) {
            infowindow.close();
            $('.search-bar input').blur();
        });
	}
    popup(csvObjects);
}

function showListView(restaurants) {
	var listView = document.getElementById('listContent');
	var listViewText = '';

	for (var i = 0; i < restaurants.length; i++) {

		listViewText += '<div class="container">';
		listViewText += '<div class="restaurant-list">';
		listViewText += '<h1>' + restaurants[i]["Name of Restaurant"] + '</h1>';
		listViewText += '<p><span class="green-color">Address: </span>' + restaurants[i]["Address"] + '</p>';
		listViewText += '<div class="row">';
		listViewText += '<div class="col-7"><p><span class="green-color">Cuisine Type:</span> ' + restaurants[i]["Cuisine"] + '</p></div>';
		listViewText += '<div class="col-5 text-right"><p><span class="green-color">Rating:</span> ' + restaurants[i]["Google Rating"] + '</p></div>';
		listViewText += '</div>';
		listViewText += '<div class="row">';
		listViewText += '<div class="col-7"><p><span class="green-color">Fully Vegetarian?:</span> ' + restaurants[i]["Fully Veg/Not"] + '</p></div>';
		listViewText += '<div class="col-5 text-right"><p><span class="green-color">Price:</span> ' + restaurants[i]["Price"] + '</p></div>';
		listViewText += '</div>';
		listViewText += '<div class="more-details">';
		listViewText += '<a id="details-accordion' + i + '" class="accordion-btn">More Details</a>';
		listViewText += '</div>';
		listViewText += '<div class="row">';
		listViewText += '<div id="details-accordion' + i + '" class="accordion">';
		listViewText += '<p><span class="green-color">Hours of Operation:</span> ' + restaurants[i]["Hours of Operation"] + '</p>';
		listViewText += '<p class="number-link" onclick="callNumber(' + restaurants[i]["Phone Number"].replace(/[- )(]/g, '') + ');"><span class="green-color">Phone Number:</span> ' + restaurants[i]["Phone Number"] + '</p>';
		listViewText += '<p><span class="green-color">Menu Items:</span> ' + restaurants[i]["Menu Items"] + '</p>';
		listViewText += '<p><span class="green-color">Notes (what to ask Chef/Waiter):</span> ' + restaurants[i]["Notes (what to ask Chef/Waiter)"] + '</p>';
		listViewText += '</div>';
		listViewText += '</div>';
		listViewText += '</div>';
		listViewText += '</div>';
	}
	listView.innerHTML = listViewText;
}

function initLocationProcedure() {
    initMap();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(displayAndWatch, locError);
    } else {
        console.log("Not supported");
    }
}

function initRestaurants(data) {
	csvObjects = $.csv.toObjects(data);
	showAllRestaurants();
}

function initApp() {
	getSpreadsheetData();
	initFilters();
}
