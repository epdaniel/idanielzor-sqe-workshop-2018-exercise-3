import $ from 'jquery';
import {parseAndGenerateStringOfSVG} from './code-analyzer';
import * as flowchart from 'flowchart.js';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let vectorToParse = $('#inputVector').val();
        let parsedCode = parseAndGenerateStringOfSVG(codeToParse, vectorToParse);
        let options = getOptions();
        let diagram = flowchart.parse(parsedCode);
        diagram.drawSVG(diagram, options);
    });
});

const getOptions = () =>{
    return  {
        'x': 0,'y': 10,'line-width': 3,'line-length': 50,
        'text-margin': 10,
        'font-size': 14,'font-color': 'black','line-color': 'black',
        'element-color': 'black','fill': 'white',
        'yes-text': 'T','no-text': 'F',
        'arrow-end': 'block','scale': 1,
        'symbols': {
            'start': {
                'font-color': 'black',
                'element-color': 'green',
                'fill': 'yellow'},
            'end':{ 'class': 'end-element' }
        },
        'flowstate' : {
            'green' : { 'fill' : '#A7D38C'}
        }
    };
};
