// Seed data for the knowledge base — grouped under a handful of projects,
// each covering several knowledge types, so the project-tab grouped view
// and the type filters all have real data to show on first login.
export const SEED_ENTRIES = [
  /* ---------------- Camera ECU Gen2 (Ethernet, CSI) ---------------- */
  {
    id: "e1", title: "Ethernet differential pair impedance requirement", interface: "Ethernet", ic: "88Q2221",
    project: "Camera ECU Gen2", types: ["Requirement"], tags: ["Impedance", "Layout", "Review"],
    content: "## Requirement\nDifferential pairs for 100BASE-T1 / 1000BASE-T1 shall maintain **100 Ω ±10%** differential impedance end to end.\n\n- Route as tightly coupled pairs, max 5 mil intra-pair skew\n- Avoid layer transitions within 200 mils of the PHY\n- Reference plane must be continuous under the full trace length\n\n```\nZdiff target: 100R ±10%\nMax skew: 5 mil\n```",
    attachments: [{ name: "impedance_stackup.xlsx", type: "xlsx" }],
    createdDate: "2026-06-02", modifiedDate: "2026-06-14", createdBy: "Ramu S.",
  },
  {
    id: "e2", title: "CSI-2 lane skew requirement", interface: "CSI", ic: "SA8155",
    project: "Camera ECU Gen2", types: ["Requirement"], tags: ["Impedance", "Layout"],
    content: "## Requirement\nCSI-2 data lane to clock lane skew shall not exceed 30 ps at the connector, including cable allowance.",
    attachments: [], createdDate: "2026-06-01", modifiedDate: "2026-06-01", createdBy: "Ramu S.",
  },
  {
    id: "e3", title: "PHY schematic review checklist", interface: "Ethernet", ic: "88Q2221",
    project: "Camera ECU Gen2", types: ["Checklist"], tags: ["PHY", "Review"],
    content: "## Checklist\n- [ ] Bootstrap resistors match target strap configuration\n- [ ] Termination network verified against datasheet reference schematic\n- [ ] Decoupling caps placed within 100 mils of each power pin\n- [ ] MDI pair length matching confirmed\n- [ ] LED indicator polarity checked",
    attachments: [{ name: "phy_checklist.xlsx", type: "xlsx" }], createdDate: "2026-06-05", modifiedDate: "2026-06-20", createdBy: "Ramu S.",
  },
  {
    id: "e4", title: "Master/slave strap mismatch caused link-up failure", interface: "Ethernet", ic: "88Q2221",
    project: "Camera ECU Gen2", types: ["Lesson Learned"], tags: ["Bootstrap", "Bringup"],
    content: "## Issue\nTwo boards on the same segment were both strapped as **master**, so the link never trained.\n\n## Root cause\nBootstrap resistor BOM variant was not updated when the board was repurposed from a slave to a master position.\n\n## Fix\nAdded a clear silkscreen label for strap intent and a BOM note tying the resistor value to board position.",
    attachments: [], createdDate: "2026-06-10", modifiedDate: "2026-06-10", createdBy: "Ramu S.",
  },
  {
    id: "e5", title: "Intermittent frame drops under vibration testing", interface: "CSI", ic: "SA8155",
    project: "Camera ECU Gen2", types: ["Issue"], tags: ["Validation", "Bringup"],
    content: "## Issue\nDuring vibration chamber testing, the camera feed drops frames in short bursts (< 200 ms) at random intervals above 8 Hz excitation.\n\n## Status\nOpen — suspect a marginal CSI connector seating rather than a signal-integrity issue; a connector with a stronger latch is on order for a re-test.",
    attachments: [], createdDate: "2026-07-02", modifiedDate: "2026-07-02", createdBy: "Ramu S.",
  },
  {
    id: "e6", title: "Chose CSI-2 over a parallel camera interface", interface: "CSI", ic: "SA8155",
    project: "Camera ECU Gen2", types: ["Design Decision"], tags: ["Validation"],
    content: "## Decision\nUse CSI-2 (D-PHY, 4-lane) instead of a parallel camera bus for the sensor link.\n\n## Rationale\n- Fewer board-to-board connector pins for the same bandwidth\n- Better EMI behavior than a wide parallel bus at this data rate\n- Sensor vendor's reference design and driver stack are CSI-2 native, cutting bring-up risk",
    attachments: [], createdDate: "2026-05-30", modifiedDate: "2026-05-30", createdBy: "Ramu S.",
  },
  {
    id: "e7", title: "EMC pre-compliance scan results, Rev B", interface: "Ethernet", ic: "88Q2221",
    project: "Camera ECU Gen2", types: ["Test Report"], tags: ["EMI", "Validation"],
    content: "## Test Report\nPre-compliance radiated emissions scan (30 MHz – 1 GHz), Rev B board, chamber A.\n\n- Overall margin ≥ 6 dB against CISPR 25 Class 5 across the band\n- One narrowband peak at 468 MHz, 4.1 dB margin — traced to the PHY reference clock harmonic\n- Recommend a ferrite on the clock feed for Rev C to restore margin above 6 dB",
    attachments: [{ name: "emc_precompliance_revB.pdf", type: "pdf" }], createdDate: "2026-07-18", modifiedDate: "2026-07-18", createdBy: "Ramu S.",
  },

  /* ---------------- Display Board V3 (Ethernet, Power) ---------------- */
  {
    id: "e8", title: "Bootstrap resistor value error on A-sample", interface: "Ethernet", ic: "88Q2221",
    project: "Display Board V3", types: ["Lesson Learned"], tags: ["Bootstrap", "Review"],
    content: "## Issue\nBootstrap pull value was swapped with an adjacent strap pin during a last-minute schematic edit.\n\n## Fix\nAdded a bootstrap-specific line item to the PHY review checklist so strap values are cross-checked against the datasheet table before release.",
    attachments: [], createdDate: "2026-06-11", modifiedDate: "2026-06-11", createdBy: "Ramu S.",
  },
  {
    id: "e9", title: "Positive rail overshoot during cold boot", interface: "Power", ic: "TPS65132",
    project: "Display Board V3", types: ["Lesson Learned"], tags: ["Power", "Bringup"],
    content: "## Issue\nPositive rail overshot target by 8% during cold boot, tripping downstream OVP.\n\n## Fix\nIncreased soft-start capacitor and re-validated overshoot across the full input voltage range.",
    attachments: [], createdDate: "2026-06-17", modifiedDate: "2026-06-17", createdBy: "Ramu S.",
  },
  {
    id: "e10", title: "Ethernet layout review checklist", interface: "Ethernet", ic: "88Q2221",
    project: "Display Board V3", types: ["Checklist"], tags: ["Layout", "Review", "EMI"],
    content: "## Checklist\n- [ ] MDI pairs routed on same layer, no layer switches\n- [ ] Common-mode choke placed before magnetics\n- [ ] Chassis ground moat clearance ≥ 100 mil\n- [ ] Magnetics center-tap decoupling per datasheet",
    attachments: [], createdDate: "2026-06-06", modifiedDate: "2026-06-06", createdBy: "Ramu S.",
  },
  {
    id: "e11", title: "VDDIO-to-core sequencing margin requirement", interface: "Power", ic: "TPS65132",
    project: "Display Board V3", types: ["Requirement"], tags: ["Power"],
    content: "## Requirement\nVDDIO shall lead the core rail by ≥ 5 ms on power-up across the full temperature range, to guarantee PLL lock on the first attempt.",
    attachments: [], createdDate: "2026-06-16", modifiedDate: "2026-06-16", createdBy: "Ramu S.",
  },
  {
    id: "e12", title: "Label strap-intent nets on silkscreen for board variants", interface: "Ethernet", ic: "88Q2221",
    project: "Display Board V3", types: ["Best Practice"], tags: ["Bootstrap", "Review"],
    content: "## Best Practice\nWhen the same board is repurposed across master/slave positions, silkscreen the strap's *intent* (not just the net name) next to the bootstrap resistor, and tie the resistor BOM variant to the board position in the BOM notes.",
    attachments: [], createdDate: "2026-06-12", modifiedDate: "2026-06-12", createdBy: "Ramu S.",
  },

  /* ---------------- 10.1in Display Board (Display, DDR) ---------------- */
  {
    id: "e13", title: "GMSL2 link lock failure at cold start", interface: "Display", ic: "MAX96752",
    project: "10.1in Display Board", types: ["Lesson Learned"], tags: ["Bringup", "Power"],
    content: "## Issue\nDeserializer failed to achieve link lock below 0°C during chamber testing.\n\n## Root cause\nPower sequencing margin between VDDIO and the core rail was too tight at cold temperature, delaying PLL lock.\n\n## Fix\nAdded 5 ms sequencing margin via supervisor RC delay and re-verified across the full temperature range.",
    attachments: [], createdDate: "2026-06-08", modifiedDate: "2026-06-08", createdBy: "Ramu S.",
  },
  {
    id: "e14", title: "DDR CA bus crosstalk on 10.1in panel variant", interface: "DDR", ic: "LPDDR4X",
    project: "10.1in Display Board", types: ["Lesson Learned"], tags: ["Layout", "EMI"],
    content: "## Issue\nCommand/address bus showed marginal eye closure on the 10.1in variant only.\n\n## Root cause\nDenser component placement on the smaller board reduced CA-to-DQ spacing below the recommended 3x trace width rule.\n\n## Fix\nAdded a minimum spacing rule to the variant layout template.",
    attachments: [], createdDate: "2026-06-15", modifiedDate: "2026-06-15", createdBy: "Ramu S.",
  },
  {
    id: "e15", title: "GMSL SerDes power sequencing checklist", interface: "Display", ic: "MAX96789",
    project: "10.1in Display Board", types: ["Checklist"], tags: ["Power", "Review"],
    content: "## Checklist\n- [ ] Serializer and deserializer core rails sequence within datasheet window\n- [ ] Supervisor thresholds verified against worst-case rail tolerance\n- [ ] PoC filter component values confirmed for target link rate\n- [ ] GPIO/interrupt pin pull direction checked",
    attachments: [{ name: "gmsl_power_seq.xlsx", type: "xlsx" }], createdDate: "2026-06-12", modifiedDate: "2026-06-18", createdBy: "Ramu S.",
  },
  {
    id: "e16", title: "LPDDR4X ZQ calibration requirement", interface: "DDR", ic: "LPDDR4X",
    project: "10.1in Display Board", types: ["Requirement"], tags: ["Impedance"],
    content: "## Requirement\nZQ calibration resistor shall be 240 Ω ±1% placed within 200 mils of the DRAM ZQ pin, referenced to the same ground as the DRAM.",
    attachments: [], createdDate: "2026-05-28", modifiedDate: "2026-05-28", createdBy: "Ramu S.",
  },
  {
    id: "e17", title: "Thermal chamber validation summary, -20C to 85C", interface: "Display", ic: "MAX96752",
    project: "10.1in Display Board", types: ["Test Report"], tags: ["Validation", "Bringup"],
    content: "## Test Report\nFull-range thermal chamber sweep, 3 boards, GMSL2 link monitored continuously.\n\n- Link lock maintained across the full -20°C to 85°C range on all 3 units\n- Worst-case lock time 38 ms at -20°C (spec: < 100 ms)\n- No bit errors observed over a 4-hour soak at each temperature extreme",
    attachments: [{ name: "thermal_chamber_summary.pdf", type: "pdf" }], createdDate: "2026-07-25", modifiedDate: "2026-07-25", createdBy: "Ramu S.",
  },
  {
    id: "e18", title: "Panel flicker observed at low brightness PWM", interface: "Display", ic: "MAX96752",
    project: "10.1in Display Board", types: ["Issue"], tags: ["Bringup"],
    content: "## Issue\nFaint flicker visible below ~10% PWM brightness on two of five bring-up units; not present at higher duty cycles.\n\n## Status\nOpen — narrowing down between PWM base frequency and a backlight driver dimming-curve setting. Not yet reproduced on the bench with a scope, only visually.",
    attachments: [], createdDate: "2026-07-30", modifiedDate: "2026-07-30", createdBy: "Ramu S.",
  },

  /* ---------------- SoC Compute Module (PCIe) ---------------- */
  {
    id: "e19", title: "PCIe Gen3 reference clock jitter issue", interface: "PCIe", ic: "",
    project: "SoC Compute Module", types: ["Lesson Learned"], tags: ["Clock", "Validation"],
    content: "## Issue\nLink training failures observed intermittently under thermal cycling.\n\n## Root cause\nReference clock buffer was operating close to its jitter spec limit at elevated temperature.\n\n## Fix\nSwitched to a lower-jitter buffer with margin and re-ran compliance testing.",
    attachments: [], createdDate: "2026-06-25", modifiedDate: "2026-06-25", createdBy: "Ramu S.",
  },
  {
    id: "e20", title: "Selected PCIe Gen3 x2 over x1 for headroom", interface: "PCIe", ic: "",
    project: "SoC Compute Module", types: ["Design Decision"], tags: ["Validation"],
    content: "## Decision\nRoute the compute module link as PCIe Gen3 x2 instead of x1.\n\n## Rationale\nx1 met today's bandwidth need with almost no margin; x2 costs two extra diff pairs but leaves headroom for the next sensor generation without a board respin.",
    attachments: [], createdDate: "2026-05-26", modifiedDate: "2026-05-26", createdBy: "Ramu S.",
  },
  {
    id: "e21", title: "Reference clock buffer margin guideline under thermal cycling", interface: "PCIe", ic: "",
    project: "SoC Compute Module", types: ["Best Practice"], tags: ["Clock", "Validation"],
    content: "## Best Practice\nWhen selecting a PCIe reference clock buffer, budget at least 30% jitter margin below the datasheet limit at the hottest rated ambient — buffers measured near their spec limit at 25°C have repeatedly failed link training once the enclosure heats up in the field.",
    attachments: [], createdDate: "2026-07-05", modifiedDate: "2026-07-05", createdBy: "Ramu S.",
  },
  {
    id: "e22", title: "PCIe Gen3 compliance test specification", interface: "PCIe", ic: "",
    project: "SoC Compute Module", types: ["Reference"], tags: ["Validation"],
    content: "PCI-SIG Gen3 base + compliance test specification set used for pre-certification bring-up: electrical idle, receiver tests, and link training compliance patterns.",
    attachments: [{ name: "pcie_gen3_compliance.pdf", type: "pdf" }], createdDate: "2026-05-22", modifiedDate: "2026-05-22", createdBy: "Ramu S.",
  },

  /* ---------------- Audio Module (A2B) ---------------- */
  {
    id: "e23", title: "A2B bus termination mismatch", interface: "A2B", ic: "",
    project: "Audio Module", types: ["Lesson Learned"], tags: ["Bringup", "Validation"],
    content: "## Issue\nIntermittent node dropouts traced to a termination mismatch at the last node on the bus.\n\n## Fix\nStandardized end-of-bus termination value across all node board variants.",
    attachments: [], createdDate: "2026-06-21", modifiedDate: "2026-06-21", createdBy: "Ramu S.",
  },
  {
    id: "e24", title: "A2B node bring-up checklist", interface: "A2B", ic: "",
    project: "Audio Module", types: ["Checklist"], tags: ["Bringup", "Review"],
    content: "## Checklist\n- [ ] Node address strap matches bus position\n- [ ] End-of-bus termination populated only on the last node\n- [ ] Superframe sync verified on the master node before enabling downstream nodes\n- [ ] I2S/TDM slot map matches the codec configuration",
    attachments: [], createdDate: "2026-06-24", modifiedDate: "2026-06-24", createdBy: "Ramu S.",
  },
  {
    id: "e25", title: "Vendor firmware bug on A2B transceiver silicon rev A2", interface: "A2B", ic: "",
    project: "Audio Module", types: ["Vendor Escalation"], tags: ["Bringup", "Validation"],
    content: "## Escalation\nTransceiver silicon rev A2 intermittently drops superframe sync when more than 3 nodes are daisy-chained; not reproducible on rev A1 boards.\n\n## Status\nCase opened with the vendor (ref# VE-22841); a firmware patch candidate is under evaluation on the bench, not yet validated across temperature.",
    attachments: [], createdDate: "2026-08-04", modifiedDate: "2026-08-04", createdBy: "Ramu S.",
  },

  /* ---------------- No project — general references & checklists ---------------- */
  {
    id: "e26", title: "88Q2221 Datasheet", interface: "Ethernet", ic: "88Q2221",
    project: "", types: ["Reference"], tags: ["PHY"],
    content: "Marvell 88Q2221 100BASE-T1/1000BASE-T1 Automotive Ethernet PHY datasheet. Contains strap tables, electrical characteristics, and reference schematic.",
    attachments: [{ name: "88Q2221_datasheet.pdf", type: "pdf" }], createdDate: "2026-05-20", modifiedDate: "2026-05-20", createdBy: "Ramu S.",
  },
  {
    id: "e27", title: "Marvell Application Note AN-2221 (Layout Guidelines)", interface: "Ethernet", ic: "88Q2221",
    project: "", types: ["Reference"], tags: ["Layout", "EMI"],
    content: "Vendor application note covering recommended layout practices, magnetics selection, and EMC pre-compliance guidance for the 88Q2221.",
    attachments: [{ name: "AN-2221_layout.pdf", type: "pdf" }], createdDate: "2026-05-21", modifiedDate: "2026-05-21", createdBy: "Ramu S.",
  },
  {
    id: "e28", title: "Power sequencing supervisor checklist", interface: "Power", ic: "TPS3702",
    project: "", types: ["Checklist"], tags: ["Power", "Review"],
    content: "## Checklist\n- [ ] Threshold resistors selected for worst-case rail tolerance\n- [ ] Delay capacitor verified against sequencing spec\n- [ ] Reset output polarity matches downstream MCU expectation",
    attachments: [], createdDate: "2026-06-19", modifiedDate: "2026-06-19", createdBy: "Ramu S.",
  },
  {
    id: "e29", title: "USB Type-C PD negotiation reference", interface: "USB", ic: "SA8155",
    project: "", types: ["Reference"], tags: ["Validation"],
    content: "Summary reference for USB-PD contract negotiation sequence used during bring-up debugging, including common failure signatures on a protocol analyzer trace.",
    attachments: [{ name: "usb_pd_reference.pdf", type: "pdf" }], createdDate: "2026-05-25", modifiedDate: "2026-05-25", createdBy: "Ramu S.",
  },
  {
    id: "e30", title: "BT antenna placement checklist", interface: "Bluetooth", ic: "",
    project: "", types: ["Checklist"], tags: ["Review", "EMI"],
    content: "## Checklist\n- [ ] Antenna keep-out zone free of copper and enclosure metal\n- [ ] Feed line length matches antenna vendor reference design\n- [ ] Ground clearance under antenna verified",
    attachments: [], createdDate: "2026-06-22", modifiedDate: "2026-06-22", createdBy: "Ramu S.",
  },
  {
    id: "e31", title: "WiFi antenna isolation requirement", interface: "WiFi", ic: "",
    project: "", types: ["Requirement"], tags: ["EMI"],
    content: "## Requirement\nIsolation between WiFi and Bluetooth antennas shall be ≥ 15 dB across the 2.4 GHz band to avoid desense.",
    attachments: [], createdDate: "2026-06-23", modifiedDate: "2026-06-23", createdBy: "Ramu S.",
  },
];
