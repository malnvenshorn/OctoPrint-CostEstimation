# coding=utf-8
from __future__ import absolute_import

__author__ = "Sven Lohrmann <malnvenshorn@gmail.com>"
__license__ = "GNU Affero General Public License http://www.gnu.org/licenses/agpl.html"
__copyright__ = "Copyright (C) 2017 Sven Lohrmann - Released under terms of the AGPLv3 License"

import octoprint.plugin


class CostEstimationPlugin(octoprint.plugin.SettingsPlugin,
                           octoprint.plugin.AssetPlugin,
                           octoprint.plugin.TemplatePlugin):

    def get_settings_defaults(self):
        return dict(
            weightOfFilament=1000,      # g
            costOfFilament=20,          # €
            densityOfFilament=1.32,     # g/cm³
            powerConsumption=0.2,       # kWh
            costOfElectricity=0.25      # €/kWh
        )

    def get_template_configs(self):
        return [
            dict(type="settings", custom_bindings=False)
        ]

    def get_assets(self):
        return dict(
            js=["js/costestimation.js"]
        )

    def get_update_information(self):
        return dict(
            costestimation=dict(
                displayName="CostEstimation",
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


__plugin_name__ = "CostEstimation"


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = CostEstimationPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
    }
