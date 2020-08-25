# coding=utf-8
from __future__ import absolute_import

__author__ = "Sven Lohrmann <malnvenshorn@mailbox.org>"
__license__ = "GNU Affero General Public License http://www.gnu.org/licenses/agpl.html"
__copyright__ = "Copyright (C) 2017 Sven Lohrmann - Released under terms of the AGPLv3 License"

import octoprint.plugin


class CostEstimationPlugin(octoprint.plugin.SettingsPlugin,
                           octoprint.plugin.AssetPlugin,
                           octoprint.plugin.TemplatePlugin):

    # SettingsPlugin

    def get_settings_defaults(self):
        return dict(
            weightOfFilament=1000,       # g
            costOfFilament=20,           # €
            densityOfFilament=1.32,      # g/cm³
            diameterOfFilament=1.75,     # mm
            powerConsumption=0.2,        # kWh
            costOfElectricity=0.25,      # €/kWh
            currency="€",
            currencyFormat="%v %s",      # %v - value, %s - currency symbol
            requiresLogin=False,
            useFilamentManager=True,
            useSpoolManager=False,
            priceOfPrinter=0,            # €
            lifespanOfPrinter=0,         # h
            maintenanceCosts=0,          # €/h
        )

    def get_settings_version(self):
        return 3

    def on_settings_migrate(self, target, current=None):
        if current is None or current == 1:
            # updating from version 0.x
            settings = ["weightOfFilament", "costOfFilament", "densityOfFilament", "diameterOfFilament"]

            filaments = self._settings.get(["filaments"])

            for entry in settings:
                value = self._settings.get([entry])
                if value is not None and filaments is not None:
                    filaments[0][entry.replace("OfFilament", "")] = value
                    self._settings.set([entry], None)

            self._settings.set(["filaments"], filaments)
        elif current == 2:
            # updating from version 1.x
            self._settings.set(["filaments"], None)
            self._settings.set(["selectedFilament"], None)
            self._settings.set(["lastId"], None)

    # TemplatePlugin

    def get_template_configs(self):
        return [
            dict(type="settings")
        ]

    # AssetPlugin

    def get_assets(self):
        return dict(
            js=["js/costestimation.js"]
        )

    # SoftwareUpdate

    def get_update_information(self):
        return dict(
            costestimation=dict(
                displayName="Cost Estimation",
                displayVersion=self._plugin_version,

                # version check: github repository
                type="github_release",
                user="malnvenshorn",
                repo="OctoPrint-CostEstimation",
                current=self._plugin_version,

                # update method: pip
                pip="https://github.com/malnvenshorn/OctoPrint-CostEstimation/archive/{target_version}.zip"
            )
        )


__plugin_name__ = "Cost Estimation"


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = CostEstimationPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
    }
