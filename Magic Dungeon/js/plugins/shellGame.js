/*:
* @plugindesc A simple shell game minigame
* @author mehfistoe
*/

(function() {

    // ---------------------------
    // Configuration
    // ---------------------------
    var POSITIONS = [240, 408, 576]; // X positions for the 3 cups on screen (might ahve to change?)
    var CUP_Y = 300;
    var MOVE_DURATION = 20; // frames per swap animation (lower = faster)
    var PIC_CUP = [1, 2, 3]; // Picture IDs for the three cups
    var PIC_BALL = 4; // Picture ID for the ball (shown briefly)

    // Cup filenames (place these in img/pictures/)
    var IMG_CUP_NORMAL = "cup_normal";
    var IMG_CUP_LIFTED = "cup_lifted";
    var IMG_BALL       = "ball";

    // ---------------------------
    // Game State
    // ---------------------------
    var _positions = [0, 1, 2]; // _positions[cupIndex] = slot (0,1,2)
    var _ballCup = 0; // which cup (0, 1, 2) hides the ball
    var _shuffling = false;
    var _waitFrames = 0;

    // ---------------------------
    // Plugin Commands
    // ---------------------------
    var _alias_pluginCommand = Game_Interpreter.prototype.pluginCommand; // RPG Maker MV something???
    Game_Interpreter.prototype.pluginCommand = function(command, args){ // where all of the plugin logic lives
        _alias_pluginCommand.call(this, command, args); // call the function?

        if(command === "ShellGame") { // STRICT equality comparison. Arguments MUST be the same data type and will not be coerced
            var action = args[0]; // actions??? is in the args array??? and has to be a string???

            if (action === "start") {
                ShellGame.start(); // starts the script???
            } else if (action === "shuffle") {
                var times = parseInt(args[1]) || 5; // So this line sets times equal to the int in args[1] or 5 if there isn't an int
                var speed = parseInt(args[2]) || MOVE_DURATION; // sets speed equal to in in args[2] or MOVE_DURATION if it cannot parse an int
                ShellGame.shuffle(times, speed);
            } else if (action === "pick") {
                var cupIndex = parseInt(args[1]) - 1; // 1-based from events
                ShellGame.pick(cupIndex);
            } else if (action === "hide") {
                ShellGame.hide();
            }
        }
    };

    // ---------------------------
    // Core ShellGameObject
    // ---------------------------
    var ShellGame = {}; // INITIALIZES THE SHELLGAME OBJECT

    // defining the functions being used above
    // Show cups and briefly reveal the ball
    ShellGame.start = function() {
        _ballCup = Math.floor(Math.random() * 3); // randoming choosing the cup that holds the ball
        _positions = [0, 1, 2]; // do we need this line? It has the same definition above

        // Show all cups in normal position
        for (var i = 0; i < 3; i++) {
            $gameScreen.showPicture( // same as Show Picture in Event Commands
                PIC_CUP[i], // specify picture ID (from 1 to 100) to link to the image (4 in this case)
                IMG_CUP_NORMAL, // name of image to be displayed
                0, // origin point of the image
                POSITIONS[i], // x coordinate of picture
                CUP_Y + 60, // y coordinate of picture
                100, // width scale %
                100, // height scale %
                255, // opacity of picture
                0 // Blend mode (0 Normal, 1 Additive, 2 Multiply, 3 Screen)
            );
        }

        // Lift the ball cup to show the ball
        $gameScreen.showPicture(
            PIC_BALL,
            IMG_BALL,
            0,
            POSITIONS[_ballCup], CUP_Y + 60,
            100, 100,
            255, 0
        );
        $gameScreen.showPicture(
            PIC_CUP[_ballCup], 
            IMG_CUP_LIFTED,
            0, 
            POSITIONS[_ballCup], CUP_Y,
            100, 100, 
            255, 0
        );

        // Store ball cup in a control variable for event access (variable 10)
        $gameVariables.setValue(10, _ballCup + 1);
    };

    // Lower the cup to hid the ball (call this after a short wait)
    ShellGame.hide = function() {
        // Hide ball picture
        $gameScreen.erasePicture(PIC_BALL);
        // Restore cup to normal
        $gameScreen.showPicture(
            PIC_CUP[_ballCup], 
            IMG_CUP_NORMAL,
            0, 
            POSITIONS[_positions[_ballCup]], CUP_Y,
            100, 100, 
            255, 0
        );
    };

    // Shuffle the cups
    ShellGame.shuffle = function(times, duration) {
        var swaps = [];

        // Build a list of random swaps
        for (var i = 0; i < times; i++) {
            var a, b;
            do {
                a = Math.floor(Math.random() * 3);
                b = Math.floor(Math.random() * 3);
            } while (a === b);
            swaps.push([a,b])
        }

        // Execute swaps in sequence using a timed chain
        ShellGame._executeSwaps(swaps, 0, duration);
    };

    ShellGame._executeSwaps = function(swaps, index, duration) { // I guess underscore function name is for functions used in functions
        if (index >= swaps.length) return;

        var a = swaps[index][0];
        var b = swaps[index][1];

        // Swap logical positions
        var tempPos = _positions[a];
        _positions[a] = _positions[b];
        _positions[b] = tempPos;

        // Animate the pictures to thie new positions
        $gameScreen.movePicture(
            PIC_CUP[a], // pictureId
            0, // origin
            POSITIONS[_positions[a]], // x coordinate
            CUP_Y, // y coordinate
            100, // scaleX (width)
            100, // scaleY (height)
            255, // opacity
            0, // blend mode
            duration // frames
        );
        $gameScreen.movePicture(
            PIC_CUP[b], 
            0,
            POSITIONS[_positions[b]], CUP_Y,
            100, 100, 
            255, 0, 
            duration
        );

        // Schedule next swap after this one finishes
        setTimeout(function() {
            ShellGame._executeSwaps(swaps, index + 1, duration);
        }, duration * 1000 / 60); // convert frames to milliseconds
    };

    // Check the player's pick
    ShellGame.pick = function(cupIndex) {
        var won = (cupIndex === _ballCup);

        // Lift the chosen cup
        $gameScreen.showPicture(
            PIC_CUP[cupIndex], IMG_CUP_LIFTED,
            0, POSITIONS[_positions[cupIndex]], CUP_Y,
            100, 100, 255, 0
        );

        if (won) {
            // Show ball under chosen cup
            $gameScreen.showPicture(
                PIC_BALL, IMG_BALL,
                0, POSITIONS[_positions[cupIndex]], CUP_Y + 60,
                100, 100, 255, 0
            );
        }

        // Write result to variable 11: 1 = win, 0 = lose
        $gameVariables.setValue(11, won ? 1 : 0);
    };
})();