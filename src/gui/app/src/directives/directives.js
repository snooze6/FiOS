angular.module('udb.directives', [])
.directive('icon', function() {
    return {
        restrict: 'E',
        controller: function ($scope, $element) {
            $scope.width = $scope.width || 32;
            $scope.height = $scope.height || 32;
            $scope.show = false;
            function render(){
                if ($scope.data && $scope.data.pixels) {
                    let canvas = $element.children()[0];
                    canvas.height = $scope.data.height; canvas.width =  $scope.data.width;
                    let ctx = canvas.getContext("2d");
                    // Load imageData
                    let imageData = ctx.createImageData(
                        $scope.data.width,
                        $scope.data.height
                    );
                    imageData.data.set($scope.data.pixels);
                    // Clear
                    // Put image in the middle
                    ctx.putImageData(
                        imageData,
                        0,
                        0
                    );

                    canvas.style.width = $scope.width+"px";
                    canvas.style.height = $scope.height+"px";

                    $scope.show = true;
                }

            }
            render();

            $scope.$watch('data', render);
        },
        scope: {
            data: '=data',
            width: '=?width',
            height: '=?height'
        },
        templateUrl: 'src/directives/templates/icon.html'
    };
})
.directive('seldev', function() {
    return {
        restrict: 'E',
        controller: function ($scope) {

            let configup = {
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                fade: true,
                asNavFor: '.slider-nav'
            };
            let configdown = {
                slidesToShow: 3,
                slidesToScroll: 1,
                asNavFor: '.slider-for',
                dots: true,
                centerMode: true,
                focusOnSelect: true
            }

        },
        scope: {
            devices: '=?devices'
        },
        templateUrl: 'src/directives/templates/device_selector.html'

    };
})
.directive('horizontalScroll', function () {
    return {
        link: function (scope, element, attrs) {
            let pos = 0;

            element.bind("DOMMouseScroll mousewheel", function (event) {
                event = window.event;
                let delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
                if ((pos + delta*32 <= 0)&&(pos + delta*32 <= 0)) {
                    pos += delta * 32;
                    // console.log('Scroll: ' + delta + ' - ' + pos + ' - width: '+element.width());
                    scope.$apply(()=>{
                        element.children().css({'transform': 'translateX(' + pos + 'px)'});
                        // for Chrome and Firefox
                        if(event.preventDefault) {
                            event.preventDefault();
                        }
                    });
                }
            });
        }
    }
})
.directive('hexview', function() {
    return {
        restrict: 'E',
        templateUrl: 'src/directives/templates/hex.html',
        link: function ($scope, elem, attr, ctrl) {


            $scope.$watch(attr['ngModel'], async function (v) {
                if (!!v &&
                    !!v.constructor &&
                    typeof v.constructor.isBuffer === 'function' &&
                    v.constructor.isBuffer(v)) {
                    await $scope.init();
                    await $scope.load(v);
                }
            });

            $scope.init = async function init(){
                // Reset the textarea value
                hexdata.value="00";
                // Init the top cell content
                for(i=0;i<16;i++)
                    header.innerHTML+=(0+i.toString(16)).slice(-2)+" ";
            };
            $scope.load = async function (data) {
                if (data) {
                    let con = new Uint8Array(data).buffer;
                    // Cast to ArrayBuffer

                    let h = "";
                    // Loop on the file bytes
                    for (i in u = new Uint8Array(con)) {
                        // Convert each byte in hexadecimal
                        h += (0 + u[i].toString(16)).slice(-2);
                    }
                    // console.log(h);

                    // Write h in the hex textarea
                    hexdata.innerHTML = h;
                    await $scope.doit();
                }
            };
            $scope.save = function save(){
                console.log('Save');
                // On click, reset the y array
                y=[];

                // For each byte, add its value converted in integer to y
                (hexdata.value+" ").replace(/(..) /g,function(k){y.push(parseInt(k,16))});

                // Trigger a download of a file containing each number converted in a character, converted in a string, converted in base64
                location="data:application/octet-stream;base64,"+btoa(String.fromCharCode.apply(!1,new Uint8Array(y)))
            };
            $scope.doit = async function (){
                value = hexdata.innerHTML
                    .replace(/[^0-9A-F]/ig,"")
                    .replace(/(..)/g,"$1 ")
                    .replace(/ $/,"")
                    .toUpperCase();
                hexdata.innerHTML = value;

                // Set the height of the textarea according to its length
                hexdata.style.height=(1.5+value.length/47)+"em";

                // Addresses
                h="";
                // Loop on textarea lines
                for(let i=0;i<value.length/48;i++)
                    // Add line number to h
                    h+=(1E7+(16*i).toString(16)).slice(-8)+" ";
                // Write h on the left column
                hexdir.innerHTML=h;

                // Raw
                h="";
                // Loop on the hex values
                for(i=0;i<value.length;i+=3)
                    // Convert them in numbers
                    c=parseInt(value.substr(i,2),16),
                        // Convert in chars (if the charCode is in [64-126] (maybe more later)) or ".".
                        h=63<c&&127>c?h+String.fromCharCode(c):h+".";
                // Write h in the right column (with line breaks every 16 chars)
                hexraw.innerHTML=h.replace(/(.{16})/g,"$1 ");
            };

            $scope.init();
        },
    };
});