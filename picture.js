/* Picture v2.2.0 - Picture element polyfill for responsive images. Authors & copyright (c) 2013: WebLinc, David Knight. */

// Picture
('HTMLPictureElement' in window) || (function(win) {
    'use strict';

    var _doc            = win.document,
        _eventPrefix    = '',
        _addEvent       = win.addEventListener || (_eventPrefix = 'on') && win.attachEvent,
        _removeEvent    = win.removeEventListener || win.detachEvent,
        _srcsetExpr     = /[^\s]+/g,

        _getPreviousSiblings = function(elem, filter) {
            var siblings = [];
            elem = elem.previousSibling;
            while (elem !== null) {
                if (!filter || filter(elem)) {
                    siblings.push(elem);
                }
                elem = elem.previousSibling;
            }
            return siblings;
        },

        _getNextSiblings = function(elem, filter) {
            var siblings = [];
            elem = elem.nextSibling;
            while (elem !== null) {
                if (!filter || filter(elem)) {
                    siblings.push(elem);
                }
                elem = elem.nextSibling;
            }
            return siblings;
        },

        _filterSpans = function(elem) {
            switch (elem.nodeName.toUpperCase()) {
                case 'SPAN':
                    return true;
                default:
                    return false;
            }
        },

        _filterImgs = function(elem) {
            switch (elem.nodeName.toUpperCase()) {
                case 'IMG':
                    return true;
                default:
                    return false;
            }
        },

        _hidePicturePlacholder = function (arr) {
            for ( var i = 0, arrLength = arr.length; i < arrLength; i++ ) {
                if ( arr[i].className.match(/postpone-placeholder/gi) !== null ) {
                    arr[i].className += ' hidden ';
                    arr[i].style.display = 'none';
                }
            }
        },

        _placeImage = function ( img, picture, sourceData ) {

            img.src = picture.pictureCurrentSrc = sourceData.src;
            sourceData.element.appendChild(img);
            sourceData.element.className += ' picture-source-loaded ';

            if ( picture.className.match(/picture-parsed/gi) === null ) {
                picture.className += ' picture-parsed ';
            }

        },

        _largerImageAlreadyLoaded = function (arr) {
            for ( var i = 0, arrLength = arr.length; i < arrLength; i++ ) {
                if ( arr[i].className.match(/picture-source-loaded/gi) !== null ) {
                    return true;
                }
            }
            return false;
        },

        /*
            applyImage
        */
        _applyImage = function(picture, sourceData) {

            var img = picture.pictureImage;
            var arrPicturePlaceholders = _getNextSiblings(picture, _filterImgs);
            var arrSourceDataPreviousSiblings = _getPreviousSiblings(sourceData.element, _filterSpans);

            if ( _largerImageAlreadyLoaded( arrSourceDataPreviousSiblings ) === true ) {
                return;
            }

            if (picture.parentNode === null) {
                sourceData.mql.removeListener(sourceData.listener);
                sourceData = picture = null;
            } else {
                if (!img) {
                    img     = picture.pictureImage = _doc.createElement('img');
                    img.alt = picture.pictureAlt;
                }

                if (sourceData && sourceData.src !== picture.pictureCurrentSrc) {

                    if ( arrPicturePlaceholders.length === 0 ) {

                        _placeImage( img, picture, sourceData );

                    } else {

                        var image = new Image();
                        image.onload = function() {

                            _placeImage( img, picture, sourceData );
                            _hidePicturePlacholder( arrPicturePlaceholders );

                        };
                        image.src = picture.pictureCurrentSrc = sourceData.src;

                    }

                }
            }
        },

        /*
            applyMediaListeners
        */
        _applyMediaListeners = function( pPictureCollection ) {
            var pictureCollection = pPictureCollection || _doc.getElementsByTagName('span');

            for (var i = 0, picture; typeof((picture = pictureCollection[i])) !== 'undefined'; i++) {
                if ('pictureSource' in picture) {
                    for (var j = picture.pictureSource.length - 1, source; typeof((source = picture.pictureSource[j])) !== 'undefined'; j--) {
                        if (!source.listener) {
                            source.listener = _createListener(picture, source);
                            source.mql.addListener(source.listener);
                        }
                    }
                }
            }
        },

        /*
            createListener
        */
        _createListener = function(picture, sourceData) {
            return function(mql) {
                var sourceList  = picture.pictureSource,
                    source      = sourceData;

                if (!mql.matches) {
                    source      = sourceList[sourceList.join('').lastIndexOf('1')];
                }

                source && _applyImage(picture, source);
            };
        },

        /*
            createSourceData
        */
        _createSourceData = function(element, src, mql, listener) {
            return   {
                element     : element,
                src         : src,
                mql         : mql,
                listener    : listener,
                toString    : function() {
                    return this.mql.matches ? 1 : 0;
                }
            };
        },

        /*
            parseSrcset
        */
        _parseSrcset = function(picture, source, srcsetAttr, mediaAttr) {
            var srcsetCollection    = (srcsetAttr.indexOf(',') >= 0 && srcsetAttr.split(',')) || [srcsetAttr],
                sourceMatch         = null;

            for (var i = 0, srcset; typeof((srcset = srcsetCollection[i])) !== 'undefined'; i++) {
                var media       = mediaAttr || 'all',
                    hints       = srcset.match(_srcsetExpr),
                    src         = hints[0],
                    dppx        = parseFloat(hints[1], 10),
                    sourceData  = null;

                if (dppx > 1) {
                    media = [
                                '(-webkit-min-device-pixel-ratio: ' + dppx + ')',
                                '(min-resolution: ' + dppx + 'dppx)',
                                '(min-resolution: ' + (dppx * 96) + 'dpi)',
                                'not all'
                            ].join(' and ' + media + ', ');
                }

                if (media) {
                    sourceData = _createSourceData(source, src, win.matchMedia(media), null);

                    sourceData.mql.matches && (sourceMatch = sourceData);

                    picture.pictureSource.push(sourceData);
                }
            }

            return sourceMatch;
        };

    win.Picture = {
        /*
            parse
        */
        parse: function( pPictureCollection ) {
            var pictureCollection = pPictureCollection || _doc.getElementsByTagName('span');
            for (var i = 0, picture; typeof((picture = pictureCollection[i])) !== 'undefined'; i++) {
                if (picture.getAttribute('data-picture') !== null && !('pictureSource' in picture)) {
                    var sourceCollection    = picture.getElementsByTagName('span'),
                        srcsetAttr          = picture.getAttribute('data-srcset'),
                        srcAttr             = '',
                        img                 = picture.getElementsByTagName('img')[0],
                        sourceData          = null,
                        srcsetSourceMatch   = null,
                        sourceMatch         = null;

                    picture.pictureSource       = [];
                    picture.pictureImage        = img && img.parentNode.nodeName !== 'NOSCRIPT' && img;
                    picture.pictureAlt          = picture.getAttribute('data-alt') || (img && img.getAttribute('alt')) || 'picture';
                    picture.pictureCurrentSrc   = '';

                    if (srcsetAttr) {
                        srcsetSourceMatch = _parseSrcset(picture, picture, srcsetAttr, '');
                        srcsetSourceMatch && (sourceMatch = srcsetSourceMatch);
                    } else {
                        srcAttr = picture.getAttribute('data-src');
                        if (srcAttr) {
                            sourceMatch = sourceData = _createSourceData(picture, srcAttr, null, null);
                        }
                    }

                    if (!srcsetAttr && !srcAttr) {
                        for (var j = sourceCollection.length - 1, source; typeof((source = sourceCollection[j])) !== 'undefined'; j--) {
                            var mediaAttr = source.getAttribute('data-media');

                            srcsetAttr  = source.getAttribute('data-srcset');
                            srcAttr     = '';

                            if (srcsetAttr) {
                                srcsetSourceMatch = _parseSrcset(picture, source, srcsetAttr, mediaAttr);
                                srcsetSourceMatch && (sourceMatch = srcsetSourceMatch);
                            } else if (mediaAttr) {
                                srcAttr = source.getAttribute('data-src');

                                if (srcAttr) {
                                    sourceData = _createSourceData(source, srcAttr, win.matchMedia(mediaAttr), null);

                                    sourceData.mql.matches && (sourceMatch = sourceData);

                                    picture.pictureSource.push(sourceData);
                                }
                            }
                        }
                    }

                    sourceMatch && _applyImage(picture, sourceMatch);
                }
            }

            _applyMediaListeners( pictureCollection );
        }
    };

})(window);
