Changelog
=========

Version 0.2.0 [2024-12-04]
--------------------------

The library has been rewritten completely. The new version is not backward
compatible with the previous versions. Refer the `migration guide
<https://github.com/openwisp/netjsongraph.js/blob/master/README.md#upgrading-from-01x-versions-to-02x>`_
for more details.

Features
~~~~~~~~

- Implemented `loading more data by specifying geographic extent
  <https://github.com/openwisp/netjsongraph.js/issues/118>`_
- Implemented `clustering
  <https://github.com/openwisp/netjsongraph.js/issues/114>`_
- Implemented `loading more devices using pagination
  <https://github.com/openwisp/netjsongraph.js/issues/117>`_
- Added `support for GeoJSON
  <https://github.com/openwisp/netjsongraph.js/issues/116>`_

Changes
~~~~~~~

- Show node labels only after a suitable zoom level
- Improved the `UI of logical and geo map
  <https://github.com/openwisp/netjsongraph.js/issues/113>`_
- Improved the UI on narrow screens
- Show element info on hover
- Include credentials in fetch requests

Bugfixes
~~~~~~~~

- Remove existing points from map in appendData before calling render
- Fix data update when switched from map to graph

Version 0.1 [2015-08-14]
------------------------

- first release
