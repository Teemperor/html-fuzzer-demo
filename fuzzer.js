var canvas = document.getElementById("fg_canvas");
var ctx = canvas.getContext("2d");

var bg_canvas = document.getElementById("bg_canvas");
var bg_ctx = bg_canvas.getContext("2d");

CanvasRenderingContext2D.prototype.clear = 
  CanvasRenderingContext2D.prototype.clear || function (preserveTransform) {
    if (preserveTransform) {
      this.save();
      this.setTransform(1, 0, 0, 1, 0, 0);
    }

    this.fillStyle = 'transparent';
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (preserveTransform) {
      this.restore();
    }           
};
Array.prototype.random = function () {
    return this[Math.floor((Math.random()*this.length))];
}
Array.prototype.weightedRandom = function () {
    var totalScore = 0;
    for (var elem of this) {
        totalScore += elem.score;
    }

    var remainingScore = Math.random() * totalScore;
    for (var elem of this) {
        remainingScore -= elem.score;
        if (remainingScore <= 0)
            return elem;
    }
    return this[this.length - 1];
}

function point(x, y) {
    return {"x" : x, "y" : y};
}

function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

var x = 10;
var y = 10;
var currentState = null;

function hasInputNearby(state, point) {
    for (var input_i in state.inputs) {
        var input = state.inputs[input_i];
        if (distance(input, point) < 3)
          return true;
    }
    return false;
}

function validPoint(point) {
    if (point.x < 0 || point.y < 0)
        return false;
    if (point.x > canvas.width)
        return false;
    if (point.y > canvas.height)
        return false;
    return true;
}

function isOptionOn(name) {
    return document.getElementById("option_" + name).checked;
}

function update(state) {
    if (state != currentState) {
        return;
    }
    ctx.clear();

    state.iterations += 1;
    document.getElementById("iterations").innerHTML = "" + state.iterations;

    for (var input of state.inputs) {
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.arc(input.x, input.y, 5, 0, Math.PI*2);
        ctx.fill();
    }

    var to_mutate = state.inputs[0];
    var to_test = Object.assign({}, to_mutate);
    
    var mutation = null;
    if (isOptionOn("weighted")) {
        mutation = state.mutations.weightedRandom();
    } else {
        mutation = state.mutations.random();
    }
    console.log(mutation);
    mutation.mutate(to_test);

    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.moveTo(to_mutate.x, to_mutate.y);
    ctx.lineTo(to_test.x, to_test.y);
    ctx.stroke();

    if (validPoint(to_test) && state.feedback(to_test) === "found") {
        document.getElementById("history").innerHTML += state.iterations + ", "
        run();
        return;
    }

    if (validPoint(to_test) &&
        state.feedback(to_test) > state.feedback(to_mutate) &&
        !hasInputNearby(state, to_test)) {
        state.inputs.push(to_test);
        state.inputs.shift();
        mutation.score += 1;
    } else {
        mutation.score /= 2;
    }

    setTimeout(function() { update(state); }, 100);
}

function update_bg(state) {
    bg_ctx.clear();
    let step = 10;
    var min = 1000000;
    var max = -min;
    for (var x = 0; x < bg_canvas.width; x += step) {
        for (var y = 0; y < bg_canvas.height; y += step) {
            let value = state.feedback({"x":x, "y":y});
            if (value < min)
                min = value;
            if (value > max)
                max = value;
        }
    }
    for (var x = 0; x < bg_canvas.width; x += step) {
        for (var y = 0; y < bg_canvas.height; y += step) {
            let value = state.feedback({"x":x, "y":y});
            let maxColor = 250;
            let rel = 2 * (value - min) / (max - min) - 1;
            let color = rel * maxColor;
            bg_ctx.beginPath();
            if (color < 0) {
                bg_ctx.fillStyle = "rgb(0, 0, " + -color + ")"; 
            } else {
                bg_ctx.fillStyle = "rgb(" + color + ", 0, 0)"; 
            }
            bg_ctx.rect(x, y, step, step);
            bg_ctx.fill();
        }
    }
}

function run() {
    var code = document.getElementById("code").value;
    feedback = eval(code);
    var state = {};
    var inputs = [];
    inputs.push({"x" : 50, "y" : 50});
    state.inputs = inputs;
    state.iterations = 0;
    state.feedback = eval(code);
    state.mutations = [];

    let move_speed = 30;
    state.mutations.push({"name" : "random",
        "score" : 1, "mutate" : function(point) {
            point.x += (2 * Math.random() - 1) * 2 * move_speed;
            point.y += (2 * Math.random() - 1) * 2 * move_speed;
            return point;
    }});
    if (isOptionOn("directed")) {
        state.mutations.push({"name" : "bottom-right",
        "score" : 1, "mutate" : function(point) {
            let r = Math.random() * move_speed;
            point.x += r;
            point.y += r;
            return point;
        }});
        state.mutations.push({"name" : "bottom-left",
            "score" : 1, "mutate" : function(point) {
                let r = Math.random() * move_speed;
                point.x -= r;
                point.y += r;
                return point;
        }});
        state.mutations.push({"name" : "top-left",
            "score" : 1, "mutate" : function(point) {
                let r = Math.random() * move_speed;
                point.x -= r;
                point.y -= r;
                return point;
        }});
        state.mutations.push({"name" : "top-right",
            "score" : 1, "mutate" : function(point) {
                let r = Math.random() * move_speed;
                point.x += r;
                point.y -= r;
                return point;
        }});
    }

    currentState = state;
    update_bg(state);
    update(state);
}



