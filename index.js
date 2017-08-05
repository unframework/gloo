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

// wurld
const world = new b2World(new b2Vec2(0, 0), true);

function doodoo() {
    const fixDef = new b2FixtureDef();
    fixDef.density = 1.0;
    fixDef.friction = 2.0;
    fixDef.restitution = 0.1;
    fixDef.shape = new b2CircleShape(0.5);

    const bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = 25 * (Math.random() - 0.5);
    bodyDef.position.y = 25 * (Math.random() - 0.5);

    const main = world.CreateBody(bodyDef);
    main.CreateFixture(fixDef);
}

function baabaa() {
    const fixDef = new b2FixtureDef()
    fixDef.density = 200.0
    fixDef.friction = 0.4
    fixDef.restitution = 0.1
    fixDef.shape = new b2PolygonShape()

    const bodyDef = new b2BodyDef()
    bodyDef.type = b2Body.b2_staticBody
    bodyDef.position.x = 0
    bodyDef.position.y = 0

    const bumperBody = world.CreateBody(bodyDef)

    var lastAngle = 0;
    const maxDist = 15;
    const maxAmount = 20;

    for (var i = 0; i < maxAmount; i++) {
        // avoid last angle
        const angle = lastAngle + 1 + (Math.PI * 2 - 2) * Math.random();
        const dist = 2 + maxDist * (i / maxAmount) + 0.25 * Math.random();

        const pos = new b2Vec2(
            dist * Math.cos(angle),
            dist * Math.sin(angle)
        )

        fixDef.shape.SetAsOrientedBox(
            Math.sqrt(dist) * (0.8 + Math.random() * 0.2),
            0.3 + Math.random() * 0.1,
            pos,
            angle + (Math.random() > 0.0 ? Math.PI * 0.5 : 0)
        )

        bumperBody.CreateFixture(fixDef)

        lastAngle = angle;
    }
}

baabaa();

for (var i = 0; i < 100; i++) {
	doodoo();
}

// setup debug draw
const ctx = canvas.getContext('2d');
ctx.translate(canvas.width / 2, canvas.height / 2);
ctx.scale(1, -1);

var debugDraw = new b2DebugDraw();
debugDraw.SetSprite(ctx);
debugDraw.SetDrawScale(30);
debugDraw.SetFillAlpha(0.3);
debugDraw.SetLineThickness(1.0);
debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
world.SetDebugDraw(debugDraw);

const STEP = 1 / 60.0;

var countdown = 0;

const timer = new Timer(STEP, function () {
	if (countdown <= 0) {
		countdown += 0.2;

		// doodoo();
	}

	countdown -= STEP;

	world.Step(STEP, 3, 3);
}, function () {
	world.DrawDebugData();
});

