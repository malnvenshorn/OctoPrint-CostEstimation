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

        self.estimatedCostString = ko.pureComputed(function() {
            if (self.printerState.filename() === undefined) return "-";
            if (self.printerState.filament().length == 0) return "-";

            var pluginSettings = self.settings.settings.plugins.costestimation;

            // calculating filament cost
            var filamentId = pluginSettings.selectedFilament.tool0();
            var filament = ko.utils.arrayFirst(pluginSettings.filaments(),
                function(item){ return item.id() == filamentId; });

            if (filament == null) return "-";

            var costOfFilament = filament.cost();
            var weightOfFilament =  filament.weight();
            var densityOfFilament = filament.density();
            var costPerWeight = costOfFilament / weightOfFilament;
            var filamentVolume = self.printerState.filament()[0].data().volume;      // cm³

            if (filamentVolume == 0) {
                var h = self.printerState.filament()[0].data().length / 10;          // cm
                var r = (filament.diameter() / 10) / 2;                              // cm
                filamentVolume = h * Math.PI * Math.pow(r, 2);
            }

            var filamentCost = costPerWeight * filamentVolume * densityOfFilament;

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

        self.onBeforeBinding = function() {
            var element = $("#state").find("hr:nth-of-type(2)");
            if (element.length) {
                var name = gettext("Cost");
                var text = gettext("Estimated print cost based on required quantity of filament and print time");
                element.before("<span title='" + text + "'>" + name + "</span>: "
                                + "<strong id='costestimation_string' data-bind='text: estimatedCostString'></strong>"
                                + "<br>");
            }
        };
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: CostEstimationViewModel,
        dependencies: ["printerStateViewModel", "settingsViewModel"],
        elements: ["#costestimation_string"]
    });
});
