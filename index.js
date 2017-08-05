const vec3 = require('gl-matrix').vec3;
const vec4 = require('gl-matrix').vec4;
const mat4 = require('gl-matrix').mat4;
const b2Vec2 = require('box2dweb').Common.Math.b2Vec2;
const b2World = require('box2dweb').Dynamics.b2World;
const b2FixtureDef = require('box2dweb').Dynamics.b2FixtureDef;
const b2CircleShape = require('box2dweb').Collision.Shapes.b2CircleShape;
const b2PolygonShape = require('box2dweb').Collision.Shapes.b2PolygonShape;
const b2BodyDef = require('box2dweb').Dynamics.b2BodyDef;
const b2Body = require('box2dweb').Dynamics.b2Body;
const b2DebugDraw = require('box2dweb').Dynamics.b2DebugDraw;
const Timer = require('./Timer');

document.title = 'GLOO';

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.background = '#70787f';
document.body.style.position = 'relative';

const canvas = document.createElement('canvas');
canvas.style.position = 'absolute';
canvas.style.top = '0vh';
canvas.style.left = '0vw';
canvas.style.width = '100vw';
canvas.style.height = '100vh';
canvas.style.background = '#fff';
document.body.appendChild(canvas);

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

const regl = require('regl')({
    canvas: canvas
})

// wurld
const world = new b2World(new b2Vec2(0, 0), true);

function doodoo() {
    const fixDef = new b2FixtureDef();
    fixDef.density = 2.0;
    fixDef.friction = 0.0;
    fixDef.restitution = 0.1;
    fixDef.shape = new b2CircleShape(0.1 + Math.random() * 0.08);

    const bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 1.2 * (Math.random() - 0.5);
    bodyDef.position.y = 1.2 * (Math.random() - 0.5);

    const main = world.CreateBody(bodyDef);
    main.CreateFixture(fixDef);

    return main;
}

function baabaa() {
    const fixDef = new b2FixtureDef()
    fixDef.density = 200.0
    fixDef.friction = 0.0
    fixDef.restitution = 0.1
    fixDef.shape = new b2PolygonShape()

    const bodyDef = new b2BodyDef()
    bodyDef.type = b2Body.b2_staticBody
    bodyDef.position.x = 0
    bodyDef.position.y = 0

    const bumperBody = world.CreateBody(bodyDef)

    const maxRows = 6;

    for (var r = 1; r < maxRows; r++) {
        const dist = 1.2 + 0.4 * r * r + r * 0.3;
        const thickness = 0.2 + r * 0.2// + r * r * 0.1;

        const offset = Math.random();

        const circ = 2 * Math.PI * dist;
        const size = dist * 0.1 + Math.sqrt(dist) * 0.3 + 0.2;
        const maxAmount = Math.floor(circ / size);

        for (var i = 0; i < maxAmount; i++) {
            const angle = (i / maxAmount) * (Math.PI * 2) + offset + Math.random() * 0.2;

            const pos = new b2Vec2(
                dist * Math.cos(angle),
                dist * Math.sin(angle)
            )

            fixDef.shape.SetAsOrientedBox(
                0.5 * size - 0.15 - Math.random() * 0.1,
                (thickness - Math.random() * 0.1) * 0.5,
                pos,
                angle + (Math.random() > 0.0 ? Math.PI * 0.5 : 0)
            )

            bumperBody.CreateFixture(fixDef)
        }
    }
}

baabaa();

for (var i = 0; i < 100; i++) {
    // doodoo();
}

// setup draw
const debugDraw = new b2DebugDraw();
var cmd;

if (!regl) {
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(1, -1);

    debugDraw.SetSprite(ctx);
    debugDraw.SetDrawScale(30);
    debugDraw.SetFillAlpha(0.3);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    world.SetDebugDraw(debugDraw);
} else {
    cmd = regl({
      vert: `
        precision mediump float;

        uniform mat4 camera;
        attribute vec2 position;

        void main() {
          vec4 worldPosition = vec4(position, 0, 1.0);
          gl_Position = camera * worldPosition;
        }
      `,

      frag: `
        precision mediump float;

        void main() {
          gl_FragColor = vec4(1.0, 0.5, 0.2, 1.0);
        }
      `,

      attributes: {
        position: regl.buffer([
          [ -1, -1 ],
          [ 1, -1 ],
          [ 1,  1 ],
          [ -1, 1 ]
        ])
      },

      uniforms: {
        camera: regl.prop('camera')
      },

      primitive: 'triangle fan',
      count: 4
    });
}

const cameraPosition = vec3.create();
const camera = mat4.create();

const STEP = 1 / 60.0;

var countdown = 0;
const bodyList = [];
const delList = [];

const imp = new b2Vec2();

const timer = new Timer(STEP, 10, function () {
    if (countdown <= 0) {
        countdown += 0.005 + bodyList.length * 0.0005;

        bodyList.push(doodoo());

        delList.length = 0;

        bodyList.forEach((b, bi) => {
            const pos = b.GetPosition();
            const l = Math.hypot(pos.x, pos.y);

            if (l > 10) {
                delList.push(bi);

                return;
            }

            imp.x = (1 / (1 + 10 * l)) * 0.5 * pos.x / l;
            imp.y = (1 / (1 + 10 * l)) * 0.5 * pos.y / l;
            b.ApplyImpulse(imp, pos);
        });

        // should monotonously increasing, so no issues due to splice
        delList.forEach(bi => {
            const b = bodyList[bi];
            bodyList.splice(bi, 1);
            world.DestroyBody(b);
        });
    } else {
        countdown -= STEP;
    }

    world.Step(STEP, 3, 3);
}, function () {
    vec3.set(cameraPosition, 21, 21, -31);

    mat4.perspective(camera, 0.3, canvas.width / canvas.height, 1, 80);
    mat4.rotateX(camera, camera, -Math.PI / 4);
    mat4.rotateZ(camera, camera, Math.PI / 4);
    mat4.translate(camera, camera, cameraPosition);

    if (!regl) {
        world.DrawDebugData();
    } else {
        regl.clear({
            color: [ 0.7, 1, 1, 1 ],
            depth: 1
        });

        cmd({
            camera: camera
        });
    }
});

