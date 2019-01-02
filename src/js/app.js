import $ from 'jquery';
import {parseCode,getGraphString,getFunctionCodeAndInitialization} from './code-analyzer';
import Viz from 'viz.js';
import * as esgraph from 'esgraph';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let args = $('#codePlaceholder1').val();
        let parsedCode = parseCode(codeToParse);
        let res = getFunctionCodeAndInitialization(parsedCode.body);
        const cfg = esgraph(res[1].body);
        let dot = esgraph.dot(cfg,{counter: 0 ,source: codeToParse});
        const workerURL = 'node_modules/viz.js/full.render.js';
        let viz = new Viz({workerURL});
        viz.renderSVGElement( 'digraph {' + getGraphString(dot,args,res[1].params,res[0]) + '}')
            .then(function(element) {
                document.body.appendChild(element);
            })
            .catch(() => {// Create a new Viz instance (@see Caveats page for more info)
                viz = new Viz({ workerURL });
            });
    });
});
