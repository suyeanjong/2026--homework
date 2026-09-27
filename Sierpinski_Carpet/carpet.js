"use strict";

var canvas;
var gl;

var points = [];

var NumTimesToSubdivide = 3;

// 선택 가능한 색상 (빨강, 초록, 파랑)
var colorTable = {
    red:   vec4( 1.0, 0.0, 0.0, 1.0 ),
    green: vec4( 0.0, 1.0, 0.0, 1.0 ),
    blue:  vec4( 0.0, 0.0, 1.0, 1.0 )
};
var currentColor = colorTable.red;

// 카펫의 시작 정사각형 (왼쪽 아래, 오른쪽 위 꼭짓점)
var vertices = [
    vec2( -1, -1 ),
    vec2(  1,  1 )
];

var bufferId;
var uColorLoc;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    uColorLoc = gl.getUniformLocation( program, "uColor" );

    setupControls();
    rebuild();
};

//
//  UI 이벤트 처리
//
function setupControls()
{
    var slider = document.getElementById( "subdivSlider" );
    slider.oninput = function() {
        NumTimesToSubdivide = parseInt( slider.value );
        document.getElementById( "subdivValue" ).textContent = NumTimesToSubdivide;
        rebuild();
    };

    document.getElementById( "colorMode" ).onchange = function( event ) {
        currentColor = colorTable[event.target.value];
        render();
    };
}

//
//  분할 횟수가 바뀌면 정점 데이터를 다시 만들어 GPU에 올린다
//
function rebuild()
{
    points = [];

    divideSquare( vertices[0], vertices[1], NumTimesToSubdivide );

    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // 사각형 하나는 삼각형 2개(정점 6개)로 그린다
    document.getElementById( "triCount" ).textContent = points.length / 6;

    render();
}

// 왼쪽 아래 a, 오른쪽 위 b 로 정해지는 사각형을 삼각형 2개로 추가
function square( a, b )
{
    var c = vec2( b[0], a[1] );   // 오른쪽 아래
    var d = vec2( a[0], b[1] );   // 왼쪽 위

    points.push( a, c, b );
    points.push( a, b, d );
}

function divideSquare( a, b, count )
{

    // check for end of recursion

    if ( count === 0 ) {
        square( a, b );
    }
    else {

        // 한 변을 3등분

        var w = ( b[0] - a[0] ) / 3;
        var h = ( b[1] - a[1] ) / 3;

        --count;

        // 9개의 작은 사각형 중 가운데를 뺀 8개

        for ( var i = 0; i < 3; ++i ) {
            for ( var j = 0; j < 3; ++j ) {
                if ( i === 1 && j === 1 ) continue;

                var p = vec2( a[0] + i * w,       a[1] + j * h );
                var q = vec2( a[0] + (i + 1) * w, a[1] + (j + 1) * h );
                divideSquare( p, q, count );
            }
        }
    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.uniform4fv( uColorLoc, flatten(currentColor) );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}
