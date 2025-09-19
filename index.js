window.onload = function(){

    const TONALITIES = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];

    const INTERVALS = {
        '1'     : {order: 1, label:'1', note: 60},
        '2b'    : {order: 2, label:'♭2', note: 61},
        '2'     : {order: 3, label:'2', note: 62},
        '3b'    : {order: 4, label:'♭3', note: 63},
        '3'     : {order: 5, label:'3', note: 64},
        '4'     : {order: 6, label:'4', note: 65},
        '5b'    : {order: 7, label:'♭5', note: 66},
        '5'     : {order: 8, label:'5', note: 67},                    
        '6b'    : {order: 10, label:'♭6', note: 68},
        '6'     : {order: 11, label:'6', note: 69},
        '7b'    : {order: 12, label:'♭7', note: 70},
        '7'     : {order: 13, label:'7', note: 71},
        '8'     : {order: 14, label:'8', note: 72},
        '9b'    : {order: 15, label:'♭9', note: 73},
        '9'     : {order: 16, label:'9', note: 74},
        '9#'    : {order: 17, label:'9♯', note: 75},
        '11'    : {order: 18, label:'11', note: 77},
        '11#'   : {order: 19, label:'11♯', note: 78},
        '13'    : {order: 20, label:'13', note: 81},
        '13b'   : {order: 21, label:'♭13', note: 82}
    };

    const INTERVAL_GROUPS = {
        "Triad": { order: 1, intervals: ['1','3','5']},
        "Triad + 8" : { order: 2, intervals: ['1','3','5','8']},                 
        "Tetrad" : { order: 3, intervals: ['1','3','5','7']},                 
        "Tetrad + 8" : { order: 4, intervals: ['1','3','5','7','8']}, 
        "Tetrad + 2,8" : { order: 5, intervals: ['1','2','3','5','7','8']}, 
        "Tetrad + 2,6,8" : { order: 6, intervals: ['1','2','3','5','6','7','8']}, 
        "Tetrad + 2,4,8" : { order: 7, intervals: ['1','2','3','4,','5','7','8']}, 
        "Major Scale" : { order: 8, intervals: ['1','2','3','4','5','6','7','8']}, 
        "Major Pentatonic" : { order: 9, intervals: ['1','2','3','5','6','8']}, 
        "Minor Pentatonic" : { order: 10, intervals: ['1','3b','4','5','7b','8']},                 
        "Natural Minor" : { order: 11, intervals: ['1','2','3b','4','5','6b','7b','8']}, 
        "Harmonic Minor" : { order: 12, intervals: ['1','2','3b','4','5','6b','7','8']},             
        "Melodic Minor" : { order: 13, intervals: ['1','2','3b','4','5','6','7','8']}, 
        "All Notes" : { order: 14, intervals:  Object.keys(INTERVALS)}
    }

    const INTERVALS_KEYS = {
        // Numbers above letters
        '49' : '1',                    
        '50' : '2',
        '51' : '3',
        '52' : '4',
        '53' : '5',
        '54' : '6',
        '55' : '7',
        '56' : '8',                    
        '57' : '9',
        '48' : '11', // [0]
        '189' : '13', // [-_]

        // Numpad
        '97' : '1',
        '98' : '2',
        '99' : '3',
        '100' : '4',
        '101' : '5',
        '102' : '6',
        '103' : '7',
        '104' : '8',
        '105' : '9',                    
        '96' : '11', // [0 ins]
        '109' : '13' // [-]
    }

    class State {
        constructor() {                        
            this.init();
            this.piano = undefined;
            this.organ = undefined;
        }

        init(){
            this.playing = false;
            this.guesses = [];
            this.sequence = [];
            this.currentGuess = undefined;
            this.currentPlayingNotes = [];
            this.current = -1;
            this.size = 10;
            this.intervalsAvailable = [];
            this.delay = 3000;
            this.transpose = 0;
        }
    }

    state = new State();            
    var btStop = document.getElementById("btStop");                                
    var btPlay = document.getElementById("btPlay");                                
    var inputSize = document.getElementById("size");
    var inputTempo = document.getElementById("tempo");             
    var selectTonality = document.getElementById("selectTonality");
    var divDisplay = document.getElementById("display");   
    var divOptions = document.getElementById("options");
    var divProgressFill = document.getElementById("fill");

    function renderTonalities(){                    
        TONALITIES.forEach((value, index) => {                    
            let option = document.createElement('option');
            option.value = index;
            option.textContent = value;
            selectTonality.appendChild(option);
        });                    
    }

    function renderIntervalOptions(){
        let divIntervals = document.getElementById("intervals");
        for(const [key, value] of Object.entries(INTERVALS).sort((a, b) => a[1].order - b[1].order)){                    
            let checkbox = document.createElement('input');
            let label = document.createElement('label');                    
            
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox-${key}`;
            checkbox.name = 'interval';
            checkbox.value = key;
            checkbox.checked = value.checked;
            
            label.htmlFor = `checkbox-${key}`;
            label.textContent = value.label;
            
            divIntervals.appendChild(checkbox);
            divIntervals.appendChild(label);

            checkbox.onchange = function(){
                updateIntervalsAvailable();
                updateScreen();
            }
        }                
    }

    function renderIntervalGroups(){                
        let select = document.getElementById("selectIntervals");
        for(const [key, value] of Object.entries(INTERVAL_GROUPS).sort((a, b) => a[1].order - b[1].order)){
            let option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            select.appendChild(option);
        }
        select.onchange = function(){
            let intervals = INTERVAL_GROUPS[select.value].intervals;                        
            const checkboxes = document.querySelectorAll('#intervals input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = intervals.includes(checkbox.value);
            });
        }      
        
        setTimeout(()=>{
            select.value = 'Major Scale';
            select.dispatchEvent(new Event('change'));
        },500);
    }

    function renderIntervalButtons(){
        let divButtons = document.getElementById("buttons");
        divButtons.innerHTML = "";
        state.intervalsAvailable.forEach((interval) => {                        
            let button = document.createElement('button');
            button.id = "button_"+interval;
            button.innerHTML = INTERVALS[interval].label;
            button.onclick = function(){
                state.currentGuess = interval;                            
                updateScreen();
            };
            divButtons.appendChild(button);                            
        });
    }

    function updateIntervalsAvailable(){
        let checkboxes = document.querySelectorAll('input[name="interval"]:checked');
        let intervalsAvailable = Array.from(checkboxes).map(checkbox => checkbox.value);                    
        state.intervalsAvailable = intervalsAvailable;
    }

    function updateSize(){
        state.size = parseInt(inputSize.value);
        console.log("Size:",state.size);
    }

    function updateTempo(){
        state.delay = 60 / parseInt(inputTempo.value) * 1000;
        console.log("Tempo:",state.delay)
    }

    function updateTonality(){
        state.transpose = parseInt(selectTonality.value);
        console.log("Transpose:",state.transpose);
    }

    function keepLastGuess(){
        if(state.current>=0 && state.current <= state.sequence.length){
            if(state.currentGuess){
                state.guesses.push(state.currentGuess);
                state.currentGuess = undefined;                            
            }else{
                state.guesses.push("?")
            }
        }
    }

    function updateScreen(){                    
        btPlay.hidden = state.playing;
        divOptions.hidden = state.playing;
        btStop.hidden = !state.playing;
        buttons.hidden = !state.playing;
                            
        if(state.playing && state.current < 0){
            divDisplay.innerHTML = "Wait...";
        }else{
            divDisplay.innerHTML = "";                    
            let guesses = Array.from(state.guesses); 
            if(state.playing && state.current < state.size){
                guesses.push(state.currentGuess);                    
            }                        
            guesses.forEach((guess, index) => {
                let span = document.createElement('span');
                divDisplay.appendChild(span);
                if(guess && guess != '?'){                            
                    span.innerHTML = INTERVALS[guess].label;                            
                }else{
                    span.innerHTML = '?';                            
                }

                if(!state.playing){
                    if(guess == state.sequence[index]){
                        span.classList.add('correct');
                    }else{
                        span.classList.add('incorrect');
                        span.classList.add('tooltip');

                        // Creates a tooltip with the right answer
                        let spanTooltip = document.createElement('span');
                        span.appendChild(spanTooltip);
                        spanTooltip.innerHTML = INTERVALS[state.sequence[index]].label;    
                        spanTooltip.classList.add('tooltiptext');
                    }
                }                            
            });
        }
        
        document.querySelectorAll("#buttons button").forEach((element) => {                        
            element.classList.remove('selected');
        });
        if(state.currentGuess){
            document.getElementById("button_"+state.currentGuess).classList.add('selected');
        }
    }        
    
    function stopProgressBar(){
        divProgressFill.style.width = "0%";
        divProgressFill.style.transition = "";
    }

    function startProgressBar(){
        stopProgressBar();                                       
        setTimeout(()=>{
            divProgressFill.style.width = "100%";
            divProgressFill.style.transition = "width "+state.delay/1000+"s linear";                    
        },100);
    }
                    
    renderTonalities();
    renderIntervalGroups();
    renderIntervalOptions();  
    loadInstruments();              
             
    function loadInstruments(){
        var audioContext = new AudioContext();                
        Soundfont.instrument(audioContext, 'acoustic_grand_piano').then((instrument) => {
            state.piano = instrument;
            console.log("Piano loaded...");                        
        });

        Soundfont.instrument(audioContext, 'drawbar_organ').then((instrument) => {
            state.organ = instrument;          
            console.log("Organ loaded...");
        });
    }

    function playDrone(){
        let duration = state.delay/1000*1.5;
        let note1 = 36+state.transpose; // 2 octaves low root 
        let note2 = 48+state.transpose; // 1 octave low root
        [note1,note2].forEach(function(note){                        
            state.currentPlayingNotes.push(state.organ.play(note, 0, { 
                duration: duration,
                gain: 0.5
            }));
        });
    }

    function playNote(note){
        let duration = state.delay/1000*0.5;                    
        state.currentPlayingNotes.push(state.piano.play(note+state.transpose, 0, {
            duration: duration,
            gain: 1.0
        }));
    }

    function playNext(){                                        
        if(state.playing && state.current < state.sequence.length - 1){
            startProgressBar();
            keepLastGuess();
            state.current += 1;
            let interval = state.sequence[state.current];
            state.currentPlayingNotes = [];
            playDrone();
            playNote(INTERVALS[interval].note);                                               
            setTimeout(playNext, state.delay);
            updateScreen();                        
        }else{
            stopPlaying();
        }
    }

    function startPlaying(){
        if(!state.playing){                        
            state.init();   
            updateSize();
            updateTempo();
            updateTonality();
            updateIntervalsAvailable();
            renderIntervalButtons();                        
            createRandomSequence();

            state.playing = true;
            playDrone();
            setTimeout(playNext, state.delay);                        
            updateScreen();
        }
    }

    function stopPlaying(){                    
        if(state.playing){
            stopProgressBar();
            keepLastGuess();
            state.playing = false;
            state.currentPlayingNotes.forEach(note => {
                note.stop();
            });
            state.currentPlayingNotes = [];
            console.log("Stopped.");
            updateScreen();                    
        }
    }

    function createRandomSequence(){                    
        let sequence = [];
        while(state.size > 0 && sequence.length < state.size){
            let index = Math.floor(Math.random() * (state.intervalsAvailable.length));
            let interval = state.intervalsAvailable[index];                              
            if(sequence.length == 0 || sequence[sequence.length-1] != interval){
                sequence.push(interval);
            }
        }                    
        state.sequence = sequence;
    }

    btPlay.onclick = function(){
        startPlaying();                    
    };
    
    btStop.onclick = function(){                    
        stopPlaying();
    };                

    inputSize.onchange = function(){
        updateSize();                    
    };

    inputTempo.onchange = function(){
        updateTempo();                    
    };

    selectTonality.onchange = function(){                        
        updateTonality();
    };

    window.addEventListener('keydown', (event) => {
        if(state.playing){
            if(event.keyCode == 38){ // arrow up = #
                if(state.currentGuess){
                    let interval = state.currentGuess + '#';
                    if(state.intervalsAvailable.includes(interval)){
                        state.currentGuess = interval;
                        updateScreen();
                    }
                }                             
            }else if(event.keyCode == 40){ // arrow down = b
                if(state.currentGuess){
                    let interval = state.currentGuess + 'b';
                    if(state.intervalsAvailable.includes(interval)){
                        state.currentGuess = interval;
                        updateScreen();
                    }
                } 
            }else{
                let interval = INTERVALS_KEYS[event.keyCode];
                if(interval){                         
                    state.currentGuess = interval;                            
                    updateScreen();                        
                }            
            }
        }
    });
};