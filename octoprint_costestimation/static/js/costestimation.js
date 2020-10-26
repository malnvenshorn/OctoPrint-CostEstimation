/*
 * View model for OctoPrint-CostEstimation
 *
 * Author: Sven Lohrmann <malnvenshorn@mailbox.org>
 * License: AGPLv3
 */

$(function() {

    function CostEstimationViewModel(parameters) {
        var self = this;

        self.printerState = parameters[0];
        self.settings = parameters[1];
        self.loginState = parameters[2];
        self.filamentManager = parameters[3];
        self.spoolManager = parameters[4];

        self.showEstimatedCost = ko.pureComputed(function() {
            return self.settings.settings.plugins.costestimation.requiresLogin() ?
                self.loginState.isUser() : true;
        });

        self.showFilamentGroup = ko.pureComputed(function() {
            var filamentManagerDisabled = self.filamentManager === null || !self.settings.settings.plugins.costestimation.useFilamentManager();
            var spoolManagerDisabled = self.spoolManager === null || !self.settings.settings.plugins.costestimation.useSpoolManager();
            return !filamentManagerDisabled && !spoolManagerDisabled;
        });

        self.estimatedCostString = ko.pureComputed(function() {
            if (!self.showEstimatedCost()) return "-";
            if (self.printerState.filename() === undefined) return "-";
            if (self.printerState.filament().length == 0) return "-";

            var pluginSettings = self.settings.settings.plugins.costestimation;
            var jobFilament =  self.printerState.filament();
            var spoolData = null;

            if (self.filamentManager !== null && pluginSettings.useFilamentManager()) {
                spoolData = self.filamentManager.selectedSpools();
            } else if (self.spoolManager !== null && pluginSettings.useSpoolManager()) {
                var selectedSpool = self.spoolManager.selectedSpoolForSidebar();
                if (selectedSpool) {
                    spoolData = [self.parseSpoolManagerData(self.spoolManager)];
                }
            }

            // calculating filament cost
            var filamentCost = 0;
            for (var i = 0; i < jobFilament.length; ++i) {
                var result = /(\d+)/.exec(jobFilament[i].name()); // extract tool id from name
                var tool = result === null ? 0 : result[1];

                if (spoolData !== null && spoolData[tool] === undefined) continue;  // skip tools with no selected spool

                var costOfFilament, weightOfFilament, densityOfFilament, diameterOfFilament;

                if (spoolData !== null) {
                    costOfFilament = spoolData[tool].cost;
                    weightOfFilament =  spoolData[tool].weight;
                    densityOfFilament = spoolData[tool].profile.density;
                    diameterOfFilament = spoolData[tool].profile.diameter;
                } else {
                    costOfFilament = parseFloat(pluginSettings.costOfFilament());
                    weightOfFilament = parseFloat(pluginSettings.weightOfFilament());
                    densityOfFilament = parseFloat(pluginSettings.densityOfFilament());
                    diameterOfFilament = parseFloat(pluginSettings.diameterOfFilament());
                }

                var costPerWeight = weightOfFilament > 0 ? costOfFilament / weightOfFilament : 0;
                var filamentLength = jobFilament[i].data().length;
                var filamentVolume = self.calculateVolume(filamentLength, diameterOfFilament) / 1000;

                filamentCost += costPerWeight * filamentVolume * densityOfFilament;
            }

            // calculating electricity cost
            var powerConsumption = parseFloat(pluginSettings.powerConsumption());
            var costOfElectricity = parseFloat(pluginSettings.costOfElectricity());
            var costPerHour = powerConsumption * costOfElectricity;
            var estimatedPrintTime = self.printerState.estimatedPrintTime() / 3600;  // h
            var electricityCost = costPerHour * estimatedPrintTime;

            // calculating printer cost
            var purchasePrice = parseFloat(pluginSettings.priceOfPrinter());
            var lifespan = parseFloat(pluginSettings.lifespanOfPrinter());
            var depreciationPerHour = lifespan > 0 ? purchasePrice / lifespan : 0;
            var maintenancePerHour = parseFloat(pluginSettings.maintenanceCosts());
            var printerCost = (depreciationPerHour + maintenancePerHour) * estimatedPrintTime;

            // assembling string
            var estimatedCost = filamentCost + electricityCost + printerCost;
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

        self.parseSpoolManagerData = function(spoolManager = null) {
            if (!spoolManager) return null;
            var selectedSpool = spoolManager.selectedSpoolForSidebar();
            if (!selectedSpool) return null;
            return {
                id: selectedSpool.databaseId() || 0,
                cost: selectedSpool.cost() || 0,
                name: selectedSpool.displayName() || "",
                profile: {
                    id: selectedSpool.databaseId() || 0,
                    density: selectedSpool.density() || 0,
                    diameter: selectedSpool.diameter() || 0,
                    material: selectedSpool.material() || "",
                    vendor: selectedSpool.vendor() || ""
                },
                temp_offset: 0,
                used: selectedSpool.usedWeight() ? parseInt(selectedSpool.usedWeight(),10) : 0,
                weight: selectedSpool.totalWeight() ? parseInt(selectedSpool.totalWeight(),10) : 0,
            };
        };
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: CostEstimationViewModel,
        dependencies: ["printerStateViewModel", "settingsViewModel",
                       "loginStateViewModel", "filamentManagerViewModel",
                       "spoolManagerViewModel"],
        optional: ["filamentManagerViewModel","spoolManagerViewModel"],
        elements: ["#costestimation_string", "#settings_plugin_costestimation"]
    });
});
