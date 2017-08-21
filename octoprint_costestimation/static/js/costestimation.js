/*
 * View model for OctoPrint-CostEstimation
 *
 * Author: Sven Lohrmann <malnvenshorn@gmail.com>
 * License: AGPLv3
 */

$(function() {

    function CostEstimationViewModel(parameters) {
        var self = this;

        self.printerState = parameters[0];
        self.settings = parameters[1];
        self.loginState = parameters[2];
        self.filamentManager = parameters[3];

        self.showEstimatedCost = ko.pureComputed(function() {
            return self.settings.settings.plugins.costestimation.requiresLogin() ?
                self.loginState.isUser() : true;
        });

        self.estimatedCostString = ko.pureComputed(function() {
            if (!self.showEstimatedCost()) return "-";
            if (self.printerState.filename() === undefined) return "-";
            if (self.printerState.filament().length == 0) return "-";

            var pluginSettings = self.settings.settings.plugins.costestimation;
            var jobFilament =  self.printerState.filament();
            var spoolData = self.filamentManager.selectedSpools();

            // calculating filament cost
            var filamentCost = 0;
            for (var tool = 0; tool < jobFilament.length; ++tool) {
                if (spoolData[tool] === undefined) continue;  // skip tools with no selected spool

                var costOfFilament = spoolData[tool].cost;
                var weightOfFilament =  spoolData[tool].weight;
                var densityOfFilament = spoolData[tool].profile.density;
                var diameterOfFilament = spoolData[tool].profile.diameter;
                var costPerWeight = costOfFilament / weightOfFilament;
                var filamentLength = jobFilament[tool].data().length;
                var filamentVolume = self.calculateVolume(filamentLength, diameterOfFilament) / 1000;

                filamentCost += costPerWeight * filamentVolume * densityOfFilament;
            }

            // calculating electricity cost
            var powerConsumption = pluginSettings.powerConsumption();
            var costOfElectricity = pluginSettings.costOfElectricity();
            var costPerHour = powerConsumption * costOfElectricity;
            var estimatedPrintTime = self.printerState.estimatedPrintTime() / 3600;  // h
            var electricityCost = costPerHour * estimatedPrintTime;

            // assembling string
            var estimatedCost = filamentCost + electricityCost;
            var currencySymbol = pluginSettings.currency();
            var currencyFormat = pluginSettings.currencyFormat();
            return currencyFormat.replace("%v", estimatedCost.toFixed(2)).replace("%s", currencySymbol);
        });

        self.calculateVolume = function(length, diameter) {
            var radius = diameter / 2;
            return length * Math.PI * radius * radius;
        };

        self.onBeforeBinding = function() {
            var element = $("#state").find("hr:nth-of-type(2)");
            if (element.length) {
                var name = gettext("Cost");
                var text = gettext("Estimated print cost based on required quantity of filament and print time");
                element.before("<div id='costestimation_string' data-bind='visible: showEstimatedCost()'><span title='" + text + "'>" + name + "</span>: <strong data-bind='text: estimatedCostString'></strong></div>");
            }
        };
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: CostEstimationViewModel,
        dependencies: ["printerStateViewModel", "settingsViewModel",
                       "loginStateViewModel", "filamentManagerViewModel"],
        elements: ["#costestimation_string"]
    });
});
