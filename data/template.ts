import { RmgFile } from "../types";

export const RMG_TEMPLATE: RmgFile = {
	"name": "每人一小块地",
	
	"gameMode": "Classic",
    "description": "templates_description_land",
    "displayWinCondition": "win_condition_1",

	"sizeX": 64,
	"sizeZ": 64,

	"gameRules":
	{
		"heroCountMin": 2,
		"heroCountMax": 5,
		"heroCountIncrement": 1,
		"heroHireBan": false,
		"encounterHoles": false,
		"winConditions":
		{
			"classic" : true,
			"desertion" : true,
			"heroLighting" : true,
			"lostStartCity" : false,
			"lostStartCityDay": 3,
			"lostStartHero" : false
		}
	},

	"variants":
	[
		{
			"orientation": 
			{
				"zeroAngleZone": "Spawn-A",
				"baseAngleMin": 0,
				"baseAngleMax": 360,
				"randomAngleAmplitude": 45,
				"randomAngleStep": 90
			},

			"border":
			{
				"cornerRadius": 0.7,
				"obstaclesWidth": 0,
				"obstaclesNoise": [ {"amp": 1, "freq": 12 } ],
				"waterWidth": 3,
				"waterNoise": [ {"amp": 1, "freq": 12 } ],
				"waterType": "water grass"
			},
			
			"zones": 
			[
				{
					"name": "Spawn-A",

					"size": 1.2,
					"layout": "zone_layout_spawn",

					"guardCutoffValue": 2500,
					"guardRandomization": 0.05,
					"guardMultiplier": 0.67,
					"guardWeeklyIncrement": 0.05,
					"guardReactionDistribution": [ 6, 2, 1, 0, 0 ],
					"diplomacyModifier": -0.5,

					"guardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"unguardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"resourcesContentPool": [ "content_pool_general_resources_start_zone_poor" ],
					"guardedPickupResourceFractions": 
					{
						"countBounds" : [],
						"fractions": [ 0.5 ]
					},
					"unguardedPickupResourceFraction": 1.0,

					"mainObjects": 
					[
						{
							"type": "Spawn",	"spawn": "Player1",
							"removeGuardIfHasOwner": true,
							"guardChance": 0.5,
							"guardValue": 3000,
							"guardWeeklyIncrement": 0.05,
							"buildingsConstructionSid": "default_buildings_construction",
							"placement": "Center"
						}
					],
					"zoneBiome": { "type": "MatchMainObject", "args": [ "0" ] },
					"crossroadsPosition" : 0,
					"roads": [
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-B"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-C"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-D"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-E"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-F"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-G"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-H"] }  },
						{ "type": "Dirt", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "MandatoryContent", "args": ["name_stables"] }  }
					],
					
					"mandatoryContent": [ "mandatory_content_center" ],
					"contentCountLimits": "content_limits_spawn"
				},
				{
					"name": "Spawn-B",

					"size": 1,
					"layout": "zone_layout_spawn",

					"guardCutoffValue": 2500,
					"guardRandomization": 0.05,
					"guardMultiplier": 0.67,
					"guardWeeklyIncrement": 0.05,
					"guardReactionDistribution": [ 6, 2, 1, 0, 0 ],
					"diplomacyModifier": -0.5,

					"guardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"unguardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"resourcesContentPool": [ "content_pool_general_resources_start_zone_poor" ],
					"guardedPickupResourceFractions": 
					{
						"countBounds" : [],
						"fractions": [ 0.5 ]
					},
					"unguardedPickupResourceFraction": 1.0,

					"mainObjects": 
					[
						{
							"type": "Spawn",	"spawn": "Player2",
							"removeGuardIfHasOwner": true,
							"guardChance": 0.5,
							"guardValue": 3000,
							"guardWeeklyIncrement": 0.05,
							"buildingsConstructionSid": "default_buildings_construction",
							"placement": "Center"
						}
					],
					"zoneBiome": { "type": "MatchMainObject", "args": [ "0" ] },
					"crossroadsPosition" : 0,
					"roads": [
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-B"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-B-Spawn-C"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-B-Spawn-H"] }  }
					],
					
					"mandatoryContent": [ "mandatory_content_spawn" ],
					"contentCountLimits": "content_limits_spawn"
				},
				{
					"name": "Spawn-C",

					"size": 1,
					"layout": "zone_layout_spawn",

					"guardCutoffValue": 2500,
					"guardRandomization": 0.05,
					"guardMultiplier": 0.67,
					"guardWeeklyIncrement": 0.05,
					"guardReactionDistribution": [ 6, 2, 1, 0, 0 ],
					"diplomacyModifier": -0.5,

					"guardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"unguardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"resourcesContentPool": [ "content_pool_general_resources_start_zone_poor" ],
					"guardedPickupResourceFractions": 
					{
						"countBounds" : [],
						"fractions": [ 0.5 ]
					},
					"unguardedPickupResourceFraction": 1.0,

					"mainObjects": 
					[
						{
							"type": "Spawn",	"spawn": "Player3",
							"removeGuardIfHasOwner": true,
							"guardChance": 0.5,
							"guardValue": 3000,
							"guardWeeklyIncrement": 0.05,
							"buildingsConstructionSid": "default_buildings_construction",
							"placement": "Center"
						}
					],
					"zoneBiome": { "type": "MatchMainObject", "args": [ "0" ] },
					"crossroadsPosition" : 0,
					"roads": [
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-C"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-B-Spawn-C"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-C-Spawn-D"] }  }
					],
					
					"mandatoryContent": [ "mandatory_content_spawn" ],
					"contentCountLimits": "content_limits_spawn"
				},
				{
					"name": "Spawn-D",

					"size": 1,
					"layout": "zone_layout_spawn",

					"guardCutoffValue": 2500,
					"guardRandomization": 0.05,
					"guardMultiplier": 0.67,
					"guardWeeklyIncrement": 0.05,
					"guardReactionDistribution": [ 6, 2, 1, 0, 0 ],
					"diplomacyModifier": -0.5,

					"guardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"unguardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"resourcesContentPool": [ "content_pool_general_resources_start_zone_poor" ],
					"guardedPickupResourceFractions": 
					{
						"countBounds" : [],
						"fractions": [ 0.5 ]
					},
					"unguardedPickupResourceFraction": 1.0,

					"mainObjects": 
					[
						{
							"type": "Spawn",	"spawn": "Player4",
							"removeGuardIfHasOwner": true,
							"guardChance": 0.5,
							"guardValue": 3000,
							"guardWeeklyIncrement": 0.05,
							"buildingsConstructionSid": "default_buildings_construction",
							"placement": "Center"
						}
					],
					"zoneBiome": { "type": "MatchMainObject", "args": [ "0" ] },
					"crossroadsPosition" : 0,
					"roads": [
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-D"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-C-Spawn-D"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-D-Spawn-E"] }  }
					],
					
					"mandatoryContent": [ "mandatory_content_spawn" ],
					"contentCountLimits": "content_limits_spawn"
				},
				{
					"name": "Spawn-E",

					"size": 1,
					"layout": "zone_layout_spawn",

					"guardCutoffValue": 2500,
					"guardRandomization": 0.05,
					"guardMultiplier": 0.67,
					"guardWeeklyIncrement": 0.05,
					"guardReactionDistribution": [ 6, 2, 1, 0, 0 ],
					"diplomacyModifier": -0.5,

					"guardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"unguardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"resourcesContentPool": [ "content_pool_general_resources_start_zone_poor" ],
					"guardedPickupResourceFractions": 
					{
						"countBounds" : [],
						"fractions": [ 0.5 ]
					},
					"unguardedPickupResourceFraction": 1.0,

					"mainObjects": 
					[
						{
							"type": "Spawn",	"spawn": "Player5",
							"removeGuardIfHasOwner": true,
							"guardChance": 0.5,
							"guardValue": 3000,
							"guardWeeklyIncrement": 0.05,
							"buildingsConstructionSid": "default_buildings_construction",
							"placement": "Center"
						}
					],
					"zoneBiome": { "type": "MatchMainObject", "args": [ "0" ] },
					"crossroadsPosition" : 0,
					"roads": [
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-E"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-D-Spawn-E"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-E-Spawn-F"] }  }
					],
					
					"mandatoryContent": [ "mandatory_content_spawn" ],
					"contentCountLimits": "content_limits_spawn"
				},
				{
					"name": "Spawn-F",

					"size": 1,
					"layout": "zone_layout_spawn",

					"guardCutoffValue": 2500,
					"guardRandomization": 0.05,
					"guardMultiplier": 0.67,
					"guardWeeklyIncrement": 0.05,
					"guardReactionDistribution": [ 6, 2, 1, 0, 0 ],
					"diplomacyModifier": -0.5,

					"guardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"unguardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"resourcesContentPool": [ "content_pool_general_resources_start_zone_poor" ],
					"guardedPickupResourceFractions": 
					{
						"countBounds" : [],
						"fractions": [ 0.5 ]
					},
					"unguardedPickupResourceFraction": 1.0,

					"mainObjects": 
					[
						{
							"type": "Spawn",	"spawn": "Player6",
							"removeGuardIfHasOwner": true,
							"guardChance": 0.5,
							"guardValue": 3000,
							"guardWeeklyIncrement": 0.05,
							"buildingsConstructionSid": "default_buildings_construction",
							"placement": "Center"
						}
					],
					"zoneBiome": { "type": "MatchMainObject", "args": [ "0" ] },
					"crossroadsPosition" : 0,
					"roads": [
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-F"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-E-Spawn-F"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-F-Spawn-G"] }  }
					],
					
					"mandatoryContent": [ "mandatory_content_spawn" ],
					"contentCountLimits": "content_limits_spawn"
				},
				{
					"name": "Spawn-G",

					"size": 1,
					"layout": "zone_layout_spawn",

					"guardCutoffValue": 2500,
					"guardRandomization": 0.05,
					"guardMultiplier": 0.67,
					"guardWeeklyIncrement": 0.05,
					"guardReactionDistribution": [ 6, 2, 1, 0, 0 ],
					"diplomacyModifier": -0.5,

					"guardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"unguardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"resourcesContentPool": [ "content_pool_general_resources_start_zone_poor" ],
					"guardedPickupResourceFractions": 
					{
						"countBounds" : [],
						"fractions": [ 0.5 ]
					},
					"unguardedPickupResourceFraction": 1.0,

					"mainObjects": 
					[
						{
							"type": "Spawn",	"spawn": "Player7",
							"removeGuardIfHasOwner": true,
							"guardChance": 0.5,
							"guardValue": 3000,
							"guardWeeklyIncrement": 0.05,
							"buildingsConstructionSid": "default_buildings_construction",
							"placement": "Center"
						}
					],
					"zoneBiome": { "type": "MatchMainObject", "args": [ "0" ] },
					"crossroadsPosition" : 0,
					"roads": [
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-G"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-F-Spawn-G"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-G-Spawn-H"] }  }
					],
					
					"mandatoryContent": [ "mandatory_content_spawn" ],
					"contentCountLimits": "content_limits_spawn"
				},
				{
					"name": "Spawn-H",

					"size": 1,
					"layout": "zone_layout_spawn",

					"guardCutoffValue": 2500,
					"guardRandomization": 0.05,
					"guardMultiplier": 0.67,
					"guardWeeklyIncrement": 0.05,
					"guardReactionDistribution": [ 6, 2, 1, 0, 0 ],
					"diplomacyModifier": -0.5,

					"guardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"unguardedContentPool": [ "content_pool_general_resources_treasure_zone_zero" ],
					"resourcesContentPool": [ "content_pool_general_resources_start_zone_poor" ],
					"guardedPickupResourceFractions": 
					{
						"countBounds" : [],
						"fractions": [ 0.5 ]
					},
					"unguardedPickupResourceFraction": 1.0,

					"mainObjects": 
					[
						{
							"type": "Spawn",	"spawn": "Player8",
							"removeGuardIfHasOwner": true,
							"guardChance": 0.5,
							"guardValue": 3000,
							"guardWeeklyIncrement": 0.05,
							"buildingsConstructionSid": "default_buildings_construction",
							"placement": "Center"
						}
					],
					"zoneBiome": { "type": "MatchMainObject", "args": [ "0" ] },
					"crossroadsPosition" : 0,
					"roads": [
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-A-Spawn-H"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-G-Spawn-H"] }  },
						{ "type": "Stone", "from": { "type": "MainObject", "args": ["0"] }, "to": { "type": "Connection", "args": ["Spawn-B-Spawn-H"] }  }
					],
					
					"mandatoryContent": [ "mandatory_content_spawn" ],
					"contentCountLimits": "content_limits_spawn"
				}
			],
			
			"connections": [
				{
					"name": "Spawn-A-Spawn-B",
					"from": "Spawn-A",
					"to": "Spawn-B",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-A-Spawn-C",
					"from": "Spawn-A",
					"to": "Spawn-C",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-A-Spawn-D",
					"from": "Spawn-A",
					"to": "Spawn-D",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-A-Spawn-E",
					"from": "Spawn-A",
					"to": "Spawn-E",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-A-Spawn-F",
					"from": "Spawn-A",
					"to": "Spawn-F",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-A-Spawn-G",
					"from": "Spawn-A",
					"to": "Spawn-G",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-A-Spawn-H",
					"from": "Spawn-A",
					"to": "Spawn-H",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-B-Spawn-C",
					"from": "Spawn-B",
					"to": "Spawn-C",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-B-Spawn-H",
					"from": "Spawn-B",
					"to": "Spawn-H",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-C-Spawn-D",
					"from": "Spawn-C",
					"to": "Spawn-D",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-D-Spawn-E",
					"from": "Spawn-D",
					"to": "Spawn-E",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-E-Spawn-F",
					"from": "Spawn-E",
					"to": "Spawn-F",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-F-Spawn-G",
					"from": "Spawn-F",
					"to": "Spawn-G",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				},
				{
					"name": "Spawn-G-Spawn-H",
					"from": "Spawn-G",
					"to": "Spawn-H",
					"connectionType": "Direct",
					"road": true,
					"guardEscape": false,
					"guardValue": 2000,
					"guardWeeklyIncrement": 0.05
				}
			]
		}
	],

	"zoneLayouts": 
	[
		{
			"name": "zone_layout_center",

			"inherits": "zone_layout_default",

			"obstaclesFill": 0.5,
			"lakesFill": 0.3,
			"minLakeArea": 10,
			
			"elevationClusterScale": 0.128,
			"elevationModes": [
				{ "weight": 1, "minElevatedFraction": 0.0, "maxElevatedFraction": 0.2 },
				{ "weight": 1, "minElevatedFraction": 0.7, "maxElevatedFraction": 0.8 }
			],
			
			"roadClusterArea": 128,
			
			"guardedEncounterDencity": 1.0,
			"guardedEncounterSizeDistribution": [ 0, 0, 6, 6, 10, 12, 6 ],
			"unguardedEncounterDencity": 0.75,
			"unguardedEncounterSizeDistribution" : [ 0, 1, 1, 6, 12, 8, 2 ],
			
			"ambientPickupDensity": 2.25,
			"ambientPickupDistribution": 
			{  
				"repulsion": 1.0,
				"noise": 0.3,
				"roadAttraction": 0.25,
				"obstacleAttraction": 0.0,
				"groupSizeWeights": [ 4, 1, 1 ]
			}
		},

		{
			"name": "zone_layout_sides",

			"inherits": "zone_layout_default",

			"obstaclesFill": 0.60,
			"lakesFill": 0.3,
			"minLakeArea": 15,

			"elevationClusterScale": 0.256,
			"elevationModes": [
				{ "weight": 1, "minElevatedFraction": 0.0, "maxElevatedFraction": 0.2 },
				{ "weight": 1, "minElevatedFraction": 0.7, "maxElevatedFraction": 0.8 }
			],

			"roadClusterArea": 128,

			"guardedEncounterDencity": 1.2,
			"guardedEncounterSizeDistribution": [ 0, 6, 6, 10, 18, 12, 10 ],
			"unguardedEncounterDencity": 1.0,
			"unguardedEncounterSizeDistribution" : [ 2, 2, 4, 4, 12, 8, 6 ],
			
			"ambientPickupDensity": 2.50,
			"ambientPickupDistribution": 
			{  
				"repulsion": 1.0,
				"noise": 0.3,
				"roadAttraction": 0.5,
				"obstacleAttraction": 0.0,
				"groupSizeWeights": [ 4, 1, 1 ]
			}
		},

		{
			"name": "zone_layout_spawn",

			"inherits": "zone_layout_default",

			"obstaclesFill": 0.45,
			"lakesFill": 0.3,
			"minLakeArea": 12,
			
			"elevationClusterScale": 0.128,
			"elevationModes": [
				{ "weight": 1, "minElevatedFraction": 0.0, "maxElevatedFraction": 0.2 },
				{ "weight": 1, "minElevatedFraction": 0.7, "maxElevatedFraction": 0.8 }
			],
			
			"roadClusterArea": 128,
			
			"guardedEncounterDencity": 1.4,
			"guardedEncounterSizeDistribution": [ 0, 6, 6, 12, 18, 12, 0 ],
			"unguardedEncounterDencity": 0.75,
			"unguardedEncounterSizeDistribution" : [ 1, 2, 3, 4, 9, 6, 2 ],
			
			"ambientPickupDensity": 2.00,
			"ambientPickupDistribution": 
			{  
				"repulsion": 1.0,
				"noise": 0.3,
				"roadAttraction": 0.5,
				"obstacleAttraction": 0.0,
				"groupSizeWeights": [ 4, 1, 1 ]
			}
		}
	],

	"mandatoryContent": 
	[
		{
			"name": "mandatory_content_center",
			"content":
			[
				{
					"sid": "watchtower",
					"isGuarded": false,
					"rules":  [ { "type": "MainObject", "args": ["0"], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"name": "name_stables",
					"sid": "stables",
					"isGuarded": false,
					"rules":  [ { "type": "MainObject", "args": ["0"], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid": "crystal_trail",
					"isGuarded": false
				},
				{
					"sid": "prison",
					"variant": 0,
					"isGuarded": false
				},
				{
					"sid": "market"
				},
				{
					"sid": "mine_gold",
					"isMine": true,
					"isGuarded": false,
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid": "mine_wood",
					"isMine": true,
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid": "mine_ore",
					"isMine": true,
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid": "mine_gemstones",
					"isGuarded": false,
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid": "mine_mercury",
					"isGuarded": false,
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid": "mine_crystals",
					"isGuarded": false,
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid": "alchemy_lab",
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid": "storage_dust",
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				}
			]
		},

		{
			"name": "mandatory_content_spawn",
			"content":
			[
				{
					"sid": "mine_gold",
					"isMine": true,
					"isGuarded": false,
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid": "mine_wood",
					"isMine": true,
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid": "mine_ore",
					"isMine": true,
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid":"gingerbread_house",
					"isGuarded": false

				},
				{ 
					"sid": "watchtower",
					"isMine": false,
					"isGuarded": false,
					"rules":  [ { "type": "MainObject", "args": [ "0" ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid": "mana_well",
					"isGuarded": false,
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				},
				{
					"sid": "storage_dust",
					"rules":  [ { "type": "Road", "args": [ ], "targetMin": 0.01, "targetMax": 0.01, "weight": 1 } ]
				}
			]
		},
	],

	"contentCountLimits":
	[
		{
			"name": "content_limits_center",
			"limits":
			[

			]
		},

		{
			"name": "content_limits_spawn",
			"limits":
			[
				{
					"sid": "flattering_mirror",
					"maxCount": 1
				},
				{
					"sid": "beer_fountain",
					"maxCount": 1
				},
				{
					"sid": "stables",
					"maxCount": 1
				},
				{
					"sid": "quixs_path",
					"maxCount": 1
				},
				{
					"sid": "insaras_eye",
					"maxCount": 1
				},
				{
					"sid": "mysterious_stone",
					"maxCount": 1
				}
			]
		}
	],

	"contentPools": 
	[

	],

	"contentLists": 
	[

	]
};