const onecolor = require('onecolor');
const vec2 = require('gl-matrix').vec2;
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
const aspectRatio = canvas.height / canvas.width;

const div = document.createElement('div');
div.style.position = 'fixed';
div.style.bottom = '10px';
div.style.right = '20px';
div.style.opacity = 0.2;
div.style.color = '#fff';
div.style.fontFamily = 'Arial';
div.style.fontSize = '24px';
div.appendChild(document.createTextNode('@line_ctrl'));
document.body.appendChild(div);

const regl = require('regl')({
    canvas: canvas
})

// wurld
const world = new b2World(new b2Vec2(0, 0), true);
const speckList = [];

function doodoo() {
    const radius = 0.1 + Math.random() * 0.08;

    const fixDef = new b2FixtureDef();
    fixDef.density = 2.0;
    fixDef.friction = 0.0;
    fixDef.restitution = 0.0;
    fixDef.shape = new b2CircleShape(radius);

    const bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 1.2 * (Math.random() - 0.5);
    bodyDef.position.y = 1.2 * (Math.random() - 0.5);

    const main = world.CreateBody(bodyDef);
    main.CreateFixture(fixDef);

    const color = new onecolor.HSL(0.05 + Math.random() * 0.15, 0.6 + Math.random() * 0.3, 0.4 + Math.random() * 0.2);

    main.particleRadius = radius;
    main.particleVelocity = vec2.fromValues(0, 0);
    main.particleSpeed = 0;
    main.particleColor = color.rgb();
    main.speckCountdown = 0;

    return main;
}

function baabaa() {
    const fixDef = new b2FixtureDef()
    fixDef.density = 200.0
    fixDef.friction = 0.0
    fixDef.restitution = 0.0
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

const ditherLib = `
// @todo credit from https://github.com/hughsk/glsl-dither

float dither4x4(vec2 position) {
  int x = int(mod(position.x, 4.0));
  int y = int(mod(position.y, 4.0));
  int index = x + y * 4;

  if (x < 8) {
    if (index == 0) return 0.0625;
    if (index == 1) return 0.5625;
    if (index == 2) return 0.1875;
    if (index == 3) return 0.6875;
    if (index == 4) return 0.8125;
    if (index == 5) return 0.3125;
    if (index == 6) return 0.9375;
    if (index == 7) return 0.4375;
    if (index == 8) return 0.25;
    if (index == 9) return 0.75;
    if (index == 10) return 0.125;
    if (index == 11) return 0.625;
    if (index == 12) return 1.0;
    if (index == 13) return 0.5;
    if (index == 14) return 0.875;
    if (index == 15) return 0.375;
  }
}
`;

// setup draw
const debugDraw = new b2DebugDraw();
var cmd, cmd2;

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

            uniform float aspectRatio;
            uniform float time;
            uniform float pulse;
            uniform float place;
            uniform vec2 origin;
            uniform float radius;
            uniform float speed;
            uniform vec2 velocity;
            uniform mat4 camera;
            attribute vec2 position;

            varying float alpha;
            varying vec2 facePosition;

            float computeParticleZ() {
                return place * 0.2 + place * place * 0.03 + 1.0 / (2.0 * place);
            }

            void main() {
                float particleRandom = fract(radius * 10000.0);
                float instability = clamp((speed - 0.3) * 10.0, 0.0, 1.0);

                float spawnSizeFactor = clamp(place * 20.0 - 1.9, 0.0, 1.0);
                float pulseSizeFactor = 1.0 + 0.1 * pulse;

                float unstableModeSizeFactor = 1.0 + instability * 0.75;
                float stableGrowthSizeFactor = 1.0 + 0.15 * place * (1.0 - 0.8 * instability);

                float flickerAmount = clamp(
                    sin(time * 8.0 * (particleRandom + 1.0)) * 10.0 - 9.0,
                    0.0,
                    1.0
                );

                float unstableFlicker = -0.05 + 0.4 * particleRandom + 0.2 * flickerAmount;

                vec4 center = vec4(
                    origin,
                    computeParticleZ(),
                    1.0
                );

                float baseAlpha = 1.0 / (1.0 + radius * place * place * 0.08);
                alpha = baseAlpha * (
                    (1.0 - instability) * (1.0 + flickerAmount * 0.2) +
                    instability * unstableFlicker
                );

                facePosition = position;

                gl_Position = camera * center + 2.75 * vec4(position.x * aspectRatio, position.y, 0, 0) * radius * (
                    spawnSizeFactor *
                    pulseSizeFactor *
                    unstableModeSizeFactor *
                    stableGrowthSizeFactor
                );
            }
        `,

        frag: `
            precision mediump float;

            uniform vec4 color;

            varying float alpha;
            varying vec2 facePosition;

            ${ditherLib}

            void main() {
                gl_FragColor = color;

                // discarding after assigning gl_FragColor, apparently may not discard otherwise due to bug
                vec2 fp2 = facePosition * facePosition;
                if (fp2.x + fp2.y > 1.0) {
                    discard;
                }

                if (dither4x4(gl_FragCoord.xy) > alpha) {
                    discard;
                }
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
            aspectRatio: regl.prop('aspectRatio'),
            time: regl.prop('time'),
            pulse: regl.prop('pulse'),
            place: regl.prop('place'),
            origin: regl.prop('origin'),
            color: regl.prop('color'),
            radius: regl.prop('radius'),
            speed: regl.prop('speed'),
            velocity: regl.prop('velocity'),
            camera: regl.prop('camera')
        },

        primitive: 'triangle fan',
        count: 4
    });

    cmd2 = regl({
        vert: `
            precision mediump float;

            uniform float aspectRatio;
            uniform float time;
            uniform float pulse;
            uniform vec3 speck;
            uniform mat4 camera;
            attribute vec2 position;

            varying float alpha;
            varying vec2 facePosition;

            float computeParticleZ(float place) {
                return place * 0.2 + place * place * 0.03 + 1.0 / (2.0 * place) + speck.z * 0.3 + speck.z * speck.z * 0.01;
            }

            void main() {
                vec2 origin = speck.xy;
                vec2 o2 = origin * origin;

                vec4 center = vec4(
                    origin,
                    computeParticleZ(sqrt(o2.x + o2.y)) + 0.2,
                    1.0
                );

                facePosition = position;
                alpha = 0.15;

                float radius = 0.1;
                gl_Position = camera * center + 2.5 * radius * vec4(position.x * aspectRatio, position.y, 0, 0);
            }
        `,

        frag: `
            precision mediump float;

            uniform vec4 color;

            varying float alpha;
            varying vec2 facePosition;

            ${ditherLib}

            void main() {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);

                // discarding after assigning gl_FragColor, apparently may not discard otherwise due to bug
                vec2 fp2 = facePosition * facePosition;
                if (fp2.x + fp2.y > 1.0) {
                    discard;
                }

                if (dither4x4(gl_FragCoord.xy) > alpha) {
                    discard;
                }
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
            aspectRatio: regl.prop('aspectRatio'),
            time: regl.prop('time'),
            pulse: regl.prop('pulse'),
            origin: regl.prop('origin'),
            color: regl.prop('color'),
            speck: regl.prop('speck'),
            radius: regl.prop('radius'),
            speed: regl.prop('speed'),
            velocity: regl.prop('velocity'),
            camera: regl.prop('camera')
        },

        primitive: 'triangle fan',
        count: 4
    });
}

const bodyOrigin = vec2.create();
const bodyColor = vec4.create();
const cameraPosition = vec3.create();
const camera = mat4.create();

const STEP = 1 / 60.0;

var countdown = 0;
const bodyList = [];
const delList = [];

const imp = new b2Vec2();

const timer = new Timer(STEP, 20, function () {
    if (countdown <= 0) {
        countdown += 0.005 + bodyList.length * 0.0005;

        bodyList.push(doodoo());
        bodyList.push(doodoo());

        delList.length = 0;

        bodyList.forEach((b, bi) => {
            const pos = b.GetPosition();
            const l = Math.hypot(pos.x, pos.y);

            if (l > 20) {
                delList.push(bi);

                return;
            }

            // apply outward pressure from center
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

    // collect stats for rendering and generate specks
    bodyList.forEach((b, bi) => {
        const pos = b.GetPosition();

        // dampen the speed
        const vel = b.GetLinearVelocity();
        b.particleSpeed = 0.8 * b.particleSpeed + 0.2 * Math.hypot(vel.x, vel.y);

        vec2.scale(b.particleVelocity, b.particleVelocity, 0.8);
        b.particleVelocity[0] += vel.x * 0.2;
        b.particleVelocity[1] += vel.y * 0.2;

        // generate specks if appropriate
        if (b.particleSpeed < 0.3 && pos.x * pos.x + pos.y * pos.y > 1) {
            if (b.speckCountdown === null) {
                // initial delay until generating a speck
                b.speckCountdown = Math.random() * 0.5;
            } else {
                // countdown
                b.speckCountdown -= STEP;
            }

            if (b.speckCountdown < 0) {
                b.speckCountdown += Math.random() * 5;

                speckList.push(vec3.fromValues(pos.x, pos.y, 0));
            }
        } else {
            // no specks
            b.speckCountdown = null;
        }
    });

    // update specks
    delList.length = 0;

    speckList.forEach((speck, si) => {
        speck[2] += STEP;

        if (speck[2] > 25) {
            delList.push(si);
        }
    });

    // should be monotonously increasing, so no issues due to splice
    delList.forEach(si => {
        const s = speckList[si];
        speckList.splice(si, 1);
    });
}, function (now) {
    mat4.perspective(camera, 0.6, canvas.width / canvas.height, 1, 80);

    // camera shake and zoom
    const zoomAmount = 1 + 0.35 * Math.sin(now * 0.17)
    vec3.set(cameraPosition, 0.02 * Math.sin(now * 3.43), 0.02 * Math.cos(now * 2.31), -25 * zoomAmount);
    mat4.translate(camera, camera, cameraPosition);

    // pitch
    mat4.rotateX(camera, camera, -Math.PI / 6 + Math.cos(now * 0.23 - 1.2) * (Math.PI / 6));

    // displace the scene downwards a bit
    vec3.set(cameraPosition, 0, 0, -4.5);
    mat4.translate(camera, camera, cameraPosition);

    // slow orbiting
    mat4.rotateZ(camera, camera, now * 0.05);

    const pulseSpeed = 1.2 * Math.sin(now * 0.8);
    const pulse = Math.max(0, Math.sin(5.0 * now + pulseSpeed) * 10.0 - 9.0);

    if (!regl) {
        world.DrawDebugData();
    } else {
        regl.clear({
            color: [ 0.02, 0.015, 0.01, 1 ],
            depth: 1
        });

        bodyList.forEach(b => {
            const pos = b.GetPosition();
            vec2.set(bodyOrigin, pos.x, pos.y);
            vec4.set(bodyColor, b.particleColor.red(), b.particleColor.green(), b.particleColor.blue(), 1)

            cmd({
                aspectRatio: aspectRatio,
                time: now,
                pulse: pulse,
                place: vec2.length(bodyOrigin),
                origin: bodyOrigin,
                color: bodyColor,
                radius: b.particleRadius,
                speed: b.particleSpeed,
                velocity: b.particleVelocity,
                camera: camera
            });
        });

        speckList.forEach(s => {
            cmd2({
                aspectRatio: aspectRatio,
                time: now,
                pulse: pulse,
                speck: s,
                camera: camera
            });
        });
    }
});

