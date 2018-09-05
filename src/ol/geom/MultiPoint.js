/**
 * @module ol/geom/MultiPoint
 */
import {extend} from '../array.js';
import {closestSquaredDistanceXY, containsXY} from '../extent.js';
import GeometryType from '../geom/GeometryType.js';
import Point from '../geom/Point.js';
import SimpleGeometry from '../geom/SimpleGeometry.js';
import {deflateCoordinates} from '../geom/flat/deflate.js';
import {inflateCoordinates} from '../geom/flat/inflate.js';
import {squaredDistance as squaredDx} from '../math.js';

/**
 * @classdesc
 * Multi-point geometry.
 *
 * @api
 */
class MultiPoint extends SimpleGeometry {

  /**
   * @param {Array<import("../coordinate.js").Coordinate>|Array<number>} coordinates Coordinates.
   *     For internal use, flat coordinates in combination with `opt_layout` are also accepted.
   * @param {import("./GeometryLayout.js").default=} opt_layout Layout.
   */
  constructor(coordinates, opt_layout) {
    super();
    if (opt_layout && !Array.isArray(coordinates[0])) {
      this.setFlatCoordinates(opt_layout, coordinates);
    } else {
      this.setCoordinates(coordinates, opt_layout);
    }
  }

  /**
   * Append the passed point to this multipoint.
   * @param {import("./Point.js").default} point Point.
   * @api
   */
  appendPoint(point) {
    if (!this.flatCoordinates) {
      this.flatCoordinates = point.getFlatCoordinates().slice();
    } else {
      extend(this.flatCoordinates, point.getFlatCoordinates());
    }
    this.changed();
  }

  /**
   * Make a complete copy of the geometry.
   * @return {!import("./MultiPoint.js").default} Clone.
   * @override
   * @api
   */
  clone() {
    const multiPoint = new MultiPoint(this.flatCoordinates.slice(), this.layout);
    return multiPoint;
  }

  /**
   * @inheritDoc
   */
  closestPointXY(x, y, closestPoint, minSquaredDistance) {
    if (minSquaredDistance < closestSquaredDistanceXY(this.getExtent(), x, y)) {
      return minSquaredDistance;
    }
    const flatCoordinates = this.flatCoordinates;
    const stride = this.stride;
    for (let i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
      const squaredDistance = squaredDx(
        x, y, flatCoordinates[i], flatCoordinates[i + 1]);
      if (squaredDistance < minSquaredDistance) {
        minSquaredDistance = squaredDistance;
        for (let j = 0; j < stride; ++j) {
          closestPoint[j] = flatCoordinates[i + j];
        }
        closestPoint.length = stride;
      }
    }
    return minSquaredDistance;
  }

  /**
   * Return the coordinates of the multipoint.
   * @return {Array<import("../coordinate.js").Coordinate>} Coordinates.
   * @override
   * @api
   */
  getCoordinates() {
    return inflateCoordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
  }

  /**
   * Return the point at the specified index.
   * @param {number} index Index.
   * @return {import("./Point.js").default} Point.
   * @api
   */
  getPoint(index) {
    const n = !this.flatCoordinates ? 0 : this.flatCoordinates.length / this.stride;
    if (index < 0 || n <= index) {
      return null;
    }
    return new Point(this.flatCoordinates.slice(
      index * this.stride, (index + 1) * this.stride), this.layout);
  }

  /**
   * Return the points of this multipoint.
   * @return {Array<import("./Point.js").default>} Points.
   * @api
   */
  getPoints() {
    const flatCoordinates = this.flatCoordinates;
    const layout = this.layout;
    const stride = this.stride;
    /** @type {Array<import("./Point.js").default>} */
    const points = [];
    for (let i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
      const point = new Point(flatCoordinates.slice(i, i + stride), layout);
      points.push(point);
    }
    return points;
  }

  /**
   * @inheritDoc
   * @api
   */
  getType() {
    return GeometryType.MULTI_POINT;
  }

  /**
   * @inheritDoc
   * @api
   */
  intersectsExtent(extent) {
    const flatCoordinates = this.flatCoordinates;
    const stride = this.stride;
    for (let i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
      const x = flatCoordinates[i];
      const y = flatCoordinates[i + 1];
      if (containsXY(extent, x, y)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Set the coordinates of the multipoint.
   * @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
   * @param {import("./GeometryLayout.js").default=} opt_layout Layout.
   * @override
   * @api
   */
  setCoordinates(coordinates, opt_layout) {
    this.setLayout(opt_layout, coordinates, 1);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = deflateCoordinates(
      this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  }
}


export default MultiPoint;
