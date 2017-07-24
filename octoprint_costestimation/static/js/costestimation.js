/*
 * View model for OctoPrint-CostEstimation
 *
 * Author: Sven Lohrmann <malnvenshorn@gmail.com>
 * License: AGPLv3
 */

$(function() {

    function FilamentEditorViewModel(filaments) {
        var self = this;

        self.filaments = filaments;
        self.selected = ko.observable(undefined);

        self.name = ko.observable();
        self.cost = ko.observable();
        self.weight = ko.observable();
        self.density = ko.observable();
        self.diameter = ko.observable();

        self.loadData = function(id){
            self.filaments().forEach(function(value, index) {
                if (value.id() === id) {
                        self.name(value.name);
                        self.cost(value.cost);
                        self.weight(value.weight);
                        self.density(value.density);
                        self.diameter(value.diameter);
                }
            });
        };
    }

    function CostEstimationViewModel(parameters) {
        var self = this;

        self.printerState = parameters[0];
        self.settings = parameters[1];

        self.filaments = ko.observableArray([]);
        self.numExtruders = ko.observable([]);

        self.onStartupComplete = function() {
            var filaments = self.settings.settings.plugins.costestimation.filaments();
            self.filaments(filaments);
        };

        self.settings.printerProfiles.currentProfileData.subscribe(function() {
            self._printerProfileUpdated();
        });

        self._printerProfileUpdated = function() {
            var currentProfileData = self.settings.printerProfiles.currentProfileData();
            // var numExtruders = (currentProfileData ? currentProfileData.extruder.count() : 0);
            var numExtruders = (currentProfileData ? 1 : 0);
            self.numExtruders(new Array(numExtruders));
        };

        self.onStartup = function() {
            self.filamentDialog = $("#settings_plugin_costestimation_filamentdialog");
        };

        self.showFilamentDialog = function() {
            self.filamentDialog.modal("show");
        };

        self.hideFilamentDialog = function() {
            self.filamentDialog.modal("hide");
        };

        self._createFilamentEditor = function() {
            var editor = new FilamentEditorViewModel(self.filaments);
            return editor;
        };

        self.editor = self._createFilamentEditor();

        self.removeFilament = function(id) {
                self.filaments.remove(function(item){ return item.id() === id; });
        };

        self.addFilament = function() {
            var id = self.settings.settings.plugins.costestimation.lastId() + 1;
            self.settings.settings.plugins.costestimation.lastId(id);

            var newObj = {
                id: ko.observable(id),
                name: ko.observable(""),
                cost: ko.observable(0),
                weight: ko.observable(0),
                density: ko.observable(0),
                diameter: ko.observable(0)
            };

            self.filaments.push(newObj);

            self.editor.selected(id);
            self.editor.loadData(id);
        };

        self.saveFilament = function() {
            var newList = [];

            self.filaments().forEach(function(value, index) {
                obj = {};
                obj['id'] = value.id;
                obj['name'] = value.name;
                obj['cost'] = value.cost;
                obj['weight'] = value.weight;
                obj['density'] = value.density;
                obj['diameter'] = value.diameter;
                newList.push(obj);
            });

            self.settings.settings.plugins.costestimation.filaments(newList);
            self.hideFilamentDialog();
        };

        self.estimatedCostString = ko.pureComputed(function() {
            if (self.printerState.filename() === undefined) return "-";
            if (self.printerState.filament().length == 0) return "-";

            var pluginSettings = self.settings.settings.plugins.costestimation;

            // calculating filament cost
            var tool0 = pluginSettings.selectedFilament.tool0();
            var filament = ko.utils.arrayFirst(self.filaments(),
                function(item){ return item.id() == tool0; });

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
        dependencies: ["printerStateViewModel", "settingsViewModel", "printerProfilesViewModel"],
        elements: ["#costestimation_string", "#settings_plugin_costestimation",
            "#settings_plugin_costestimation_filamentdialog"]
    });
});
