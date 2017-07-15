/*
 * View model for OctoPrint-CostEstimation
 *
 * Author: Sven Lohrmann
 * License: AGPLv3
 */

$(function() {
    function CostEstimationViewModel(parameters) {
        var self = this;

        self.printerState = parameters[0];
        self.settings = parameters[1];

        self.estimatedCostString = ko.pureComputed(function() {
            if (self.printerState.filename() == undefined || self.printerState.filament().length == 0) {
                return "-";
            }

            var costOfFilament = self.settings.settings.plugins.costestimation.costOfFilament();
            var weightOfFilament =  self.settings.settings.plugins.costestimation.weightOfFilament();
            var densityOfFilament = self.settings.settings.plugins.costestimation.densityOfFilament();
            var powerConsumption = self.settings.settings.plugins.costestimation.powerConsumption();
            var costOfElectricity = self.settings.settings.plugins.costestimation.costOfElectricity();
            var costPerWeight = costOfFilament / weightOfFilament;
            var costPerHour = powerConsumption * costOfElectricity;
            var filamentVolume = self.printerState.filament()[0].data().volume;      // cm³
            var estimatedPrintTime = self.printerState.estimatedPrintTime() / 3600;  // h
            var estimatedCost = costPerWeight * filamentVolume * densityOfFilament + costPerHour * estimatedPrintTime;

            return "" + estimatedCost.toFixed(2) + "€";
        });

        self.onBeforeBinding = function() {
            var element = $("#state").find("hr:nth-of-type(2)");
            if (element.length) {
                var name = gettext("Cost");
                var text = gettext("Estimated cost based on required quantity of filament and print time");
                element.before("<span title='" + text + "'>" + name + "</span>: "
                                + "<strong id='costestimation' data-bind='text: estimatedCostString'></strong>"
                                + "<br>");
            }
        };
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: CostEstimationViewModel,
        dependencies: ["printerStateViewModel", "settingsViewModel"],
        elements: ["#costestimation"]
    });
});
