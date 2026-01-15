###########
 Changelog
###########

****************************
 Version 0.3.0 [2025-10-27]
****************************

Features
========

- Added option to display node labels only after reaching a specific zoom
  level `#148 <https://github.com/openwisp/netjsongraph.js/issues/148>`_.
- Added Node Clients `#153
  <https://github.com/openwisp/netjsongraph.js/issues/153>`_.
- Implemented a **Cluster Prevention Mechanism** to avoid overlapping
  nodes in geographic maps `#171
  <https://github.com/openwisp/netjsongraph.js/issues/171>`_.
- Added support for custom Coordinate Reference Systems (CRS) in the
  default configuration `#380
  <https://github.com/openwisp/netjsongraph.js/issues/380>`_ `#188
  <https://github.com/openwisp/netjsongraph.js/issues/188>`_.

Changes
=======

Other changes
-------------

- Improved consistency in geographic map rendering `#395
  <https://github.com/openwisp/netjsongraph.js/issues/395>`_.

Dependencies
------------

- Bumped ``echarts==5.6.0``.
- Bumped ``echarts-gl==2.0.9``.
- Bumped ``zrender==6.0.0``.

Bugfixes
========

- Fixed incorrect default ``nodeCategories`` values.
- Resolved configuration conflicts when using multiple instances
  simultaneously.
- Displayed node labels correctly at higher zoom levels in geographic maps
  `#189 <https://github.com/openwisp/netjsongraph.js/issues/189>`_.
- Isolated CSS rules to prevent styling conflicts with other components
  `#303 <https://github.com/openwisp/netjsongraph.js/issues/303>`_.
- Adjusted default zoom limits in geographic maps for better navigation
  `#188 <https://github.com/openwisp/netjsongraph.js/issues/188>`_.
- Fixed ``disableClusteringAtLevel`` behavior on initial render `#353
  <https://github.com/openwisp/netjsongraph.js/issues/353>`_.
- Corrected handling of duplicate node IDs `#164
  <https://github.com/openwisp/netjsongraph.js/issues/164>`_.

****************************
 Version 0.2.0 [2024-12-04]
****************************

The library has been rewritten completely. The new version is not backward
compatible with the previous versions. Refer the `migration guide
<https://github.com/openwisp/netjsongraph.js/blob/master/README.md#upgrading-from-01x-versions-to-02x>`_
for more details.

Features
========

- Implemented `loading more data by specifying geographic extent
  <https://github.com/openwisp/netjsongraph.js/issues/118>`_
- Implemented `clustering
  <https://github.com/openwisp/netjsongraph.js/issues/114>`_
- Implemented `loading more devices using pagination
  <https://github.com/openwisp/netjsongraph.js/issues/117>`_
- Added `support for GeoJSON
  <https://github.com/openwisp/netjsongraph.js/issues/116>`_

Changes
=======

- Show node labels only after a suitable zoom level
- Improved the `UI of logical and geo map
  <https://github.com/openwisp/netjsongraph.js/issues/113>`_
- Improved the UI on narrow screens
- Show element info on hover
- Include credentials in fetch requests

Bugfixes
========

- Remove existing points from map in appendData before calling render
- Fix data update when switched from map to graph

**************************
 Version 0.1 [2015-08-14]
**************************

- first release
