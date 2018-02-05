angular.module('udb.filters', [])
.filter('reverse', function() {
    return function(items) {
        if (items && items.length>0) {
            return items.slice().reverse();
        } else {
            return items
        }
    };
})
.filter('bool', function() {
    return function(item) {
        return item ? 'on' : item == null ? 'unk': 'off'
    };
})
.filter('type', function() {
    return function(item) {
        return (item.attributes.NSFileType === 'NSFileTypeDirectory') ?
            'folder':'file';
    };
})
.filter('hex', function() {
    return function(item) {
        return '0x'+item.toString(16);
    };
})
.filter('toHex', function () {
    return function (item, num) {
        let s = item.toString(16).toUpperCase();
        while (s.length < num) {
            s = '0' + s;
        }
        return s;
    }
})
.filter('toChar', function () {
    return function (item) {
        return item <= 32 ? ' ' : String.fromCharCode(item);
    }
})
.filter('getImage', function () {
    return function (item) {
        if (item.id === 'local'){
            return 'img/laptop.png'
        }
        if(item.id ==='tcp'){
            return 'img/laptop-remote.png'
        }
        if (item.id.toLowerCase().indexOf('tcp') > -1){
            if (item.name.toLowerCase().indexOf('iphone') > -1){
                return 'img/device-iphone-remote.png'
            }
            if (item.name.toLowerCase().indexOf('ipad') > -1){
                return 'img/device-ipad-remote.png'
            }
            if (item.name.toLowerCase().indexOf('ipod') > -1){
                return 'img/device-ipod-remote.png'
            }
            return 'img/device-remote.png'
        } else {
            if (item.name.toLowerCase().indexOf('iphone') > -1){
                return 'img/device-iphone.png'
            }
            if (item.name.toLowerCase().indexOf('ipad') > -1){
                return 'img/device-ipad.png'
            }
            if (item.name.toLowerCase().indexOf('ipod') > -1){
                return 'img/device-ipod.png'
            }
            return 'img/device.png'
        }
    }
})
.filter('highlight', function($sce) {
    return function(text, phrase) {
        if (phrase) text = text.replace(new RegExp('('+htmlEscape(phrase)+')', 'gi'),
            '<span class="highlighted">$1</span>');
        return $sce.trustAsHtml(text)
    }
});