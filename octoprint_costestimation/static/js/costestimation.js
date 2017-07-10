/*
 * View model for OctoPrint-CostEstimation
 *
 * Author: Sven Lohrmann
 * License: AGPLv3
 */
$(function() {
    function CostEstimationViewModel(parameters) {
        var self = this;

        var printerState = parameters[0];
        var settings = parameters[1];

        printerState.estimatedCost = ko.pureComputed(function() {
            if (printerState.filename() == undefined) return "-";

            var costOfFilament = settings.settings.plugins.costestimation.costOfFilament();
            var weightOfFilament =  settings.settings.plugins.costestimation.weightOfFilament();
            var densityOfFilament = settings.settings.plugins.costestimation.densityOfFilament();
            var powerConsumption = settings.settings.plugins.costestimation.powerConsumption();
            var costOfElectricity = settings.settings.plugins.costestimation.costOfElectricity();
            var costPerWeight = costOfFilament / weightOfFilament;
            var costPerHour = powerConsumption * costOfElectricity;
            var filamentVolume = printerState.filament()[0].data().volume;      // cm³
            var estimatedPrintTime = printerState.estimatedPrintTime() / 3600;  // h
            var estimatedCost = costPerWeight * filamentVolume * densityOfFilament
                                + costPerHour * estimatedPrintTime;

            return "" + estimatedCost.toFixed(2) + "€";
        });

        self.onStartup = function() {
            var element = $("#state").find(".accordion-inner .progress");
            if (element.length) {
                var text = gettext("Cost");
                element.before(text + ": <strong data-bind='text: estimatedCost'></strong><br>");
            }
        };
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: CostEstimationViewModel,
        dependencies: ["printerStateViewModel", "settingsViewModel"]
    });
});
