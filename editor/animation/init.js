//Dont change it
requirejs(['ext_editor_1', 'jquery_190', 'raphael_210'],
    function (ext, $, TableComponent) {

        var cur_slide = {};

        ext.set_start_game(function (this_e) {
        });

        ext.set_process_in(function (this_e, data) {
            cur_slide["in"] = data[0];
        });

        ext.set_process_out(function (this_e, data) {
            cur_slide["out"] = data[0];
        });

        ext.set_process_ext(function (this_e, data) {
            cur_slide.ext = data;
            this_e.addAnimationSlide(cur_slide);
            cur_slide = {};
        });

        ext.set_process_err(function (this_e, data) {
            cur_slide['error'] = data[0];
            this_e.addAnimationSlide(cur_slide);
            cur_slide = {};
        });

        ext.set_animate_success_slide(function (this_e, options) {
            var $h = $(this_e.setHtmlSlide('<div class="animation-success"><div></div></div>'));
            this_e.setAnimationHeight(115);
        });


        var dotN = 16;
        var cellN = 4;
        var cellSize = 40;
        var zx = 20;
        var zy = 20;
        var fullX = cellSize * (cellN - 1) + zx * 2;
        var fullY = cellSize * (cellN - 1) + zy * 2;


        var colorCell = "#737370";
        var colorDark = "#294270";
        var colorOrange = "#F0801A";
        var colorLightOrange = "#FABA00";
        var colorBlue = "#006CA9";
        var colorLightBlue = "#8FC7ED";
        var colorWhite = "#FFFFFF";

        var attrDot = {"stroke": colorDark, "r": 6, "fill": colorDark};
        var attrLine = {"stroke": colorDark, "stroke-width": 3};
        var attrPlaceLine = {"stroke": colorLightBlue, "stroke-width": 1, "stroke-dasharray": ["-"]};
        var attrText = {"stroke": colorDark, "font-size": 12, "font-family": "Verdana"};
        var attrSquare = {"stroke": colorOrange, "stroke-width": 1};

        var tooltip = false;

        function createLinePath(x1, y1, x2, y2) {
            return "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
        }

        function createDotsCanvas(paper, lines, expl) {
            var dotSet = paper.set();
            var lineDict = {};
            for (var i = 0; i < dotN; i++) {
                var dot = paper.circle(zx + (i % 4) * cellSize,
                    zy + Math.floor(i / 4) * cellSize, 1).attr(attrDot);
                dotSet.push(dot);
                paper.text(zx * 0.4 + (i % 4) * cellSize,
                    zy * 0.4 + Math.floor(i / 4) * cellSize, String(i + 1)).attr(attrText);
            }
            for (i = 1; i <= dotN; i++) {
                if (i % 4 !== 0) {
                    paper.path(createLinePath(
                        dotSet[i - 1].attr("cx"),
                        dotSet[i - 1].attr("cy"),
                        dotSet[i].attr("cx"),
                        dotSet[i].attr("cy")
                    )).attr(attrPlaceLine);
                }
                if (i <= dotN - cellN) {
                    paper.path(createLinePath(
                        dotSet[i - 1].attr("cx"),
                        dotSet[i - 1].attr("cy"),
                        dotSet[i + 3].attr("cx"),
                        dotSet[i + 3].attr("cy")
                    )).attr(attrPlaceLine);
                }

            }
            dotSet.toFront();
            for (i = 0; i < lines.length; i++) {
                var from = lines[i][0];
                var to = lines[i][1];
                lineDict[from * 100 + to] = paper.path(createLinePath(
                    dotSet[from - 1].attr("cx"),
                    dotSet[from - 1].attr("cy"),
                    dotSet[to - 1].attr("cx"),
                    dotSet[to - 1].attr("cy")
                )).attr(attrLine);
            }
            for (i = 0; i < expl.length; i++) {
                paper.rect(dotSet[expl[i][0] - 1].attr("cx"),
                    dotSet[expl[i][0] - 1].attr("cy"),
                    cellSize * expl[i][1],
                    cellSize * expl[i][2]
                ).attr(attrSquare);
            }
            return [dotSet, lineDict];
        }


        ext.set_animate_slide(function (this_e, data, options) {
            var $content = $(this_e.setHtmlSlide(ext.get_template('animation'))).find('.animation-content');
            if (!data) {
                console.log("data is undefined");
                return false;
            }

            var checkioInput = data.in;

            if (data.error) {
                $content.find('.call').html('Fail: checkio(' + JSON.stringify(checkioInput) + ')');
                $content.find('.output').html(data.error.replace(/\n/g, ","));

                $content.find('.output').addClass('error');
                $content.find('.call').addClass('error');
                $content.find('.answer').remove();
                $content.find('.explanation').remove();
                this_e.setAnimationHeight($content.height() + 60);
                return false;
            }

            var rightResult = data.ext["answer"];
            var userResult = data.out;
            var result = data.ext["result"];
            var result_addon = data.ext["result_addon"];


            //if you need additional info from tests (if exists)
            var explanation = data.ext["explanation"];

            $content.find('.output').html('&nbsp;Your result:&nbsp;' + JSON.stringify(userResult));

            if (!result) {
                $content.find('.call').html('Fail: checkio(' + JSON.stringify(checkioInput) + ')');
                $content.find('.answer').html('Right result:&nbsp;' + JSON.stringify(rightResult));
                $content.find('.answer').addClass('error');
                $content.find('.output').addClass('error');
                $content.find('.call').addClass('error');
            }
            else {
                $content.find('.call').html('Pass: checkio(' + JSON.stringify(checkioInput) + ')');
                $content.find('.answer').remove();
            }
            //Dont change the code before it

            var canvas = Raphael($content.find(".explanation")[0], fullX, fullY, 0, 0);
            createDotsCanvas(canvas, checkioInput, explanation);


            this_e.setAnimationHeight($content.height() + 60);

        });

        var $tryit;
//
        ext.set_console_process_ret(function (this_e, ret) {
            $tryit.find(".checkio-result-in").html(ret);


        });

        ext.set_generate_animation_panel(function (this_e) {

            function decodeLinesDict(hashList) {
                var list = [];
                for (n in hashList) {
                    list.push([Math.floor(n / 100), n % 100]);
                }
                return list;
            }

            function decodeLine (n) {
                return [Math.floor(n / 100), n % 100]
            }

            var startArray = [
                [1, 2],
                [2, 6],
                [1, 5],
                [5, 6]
            ];

            $tryit = $(this_e.setHtmlTryIt(ext.get_template('tryit')));

            var tCanvas = Raphael($tryit.find(".tryit-canvas")[0], fullX, fullY, 0, 0);
            var res = createDotsCanvas(tCanvas, startArray, []);
            var tDotSet = res[0];
            var tLinesDict = res[1];
            var activeRect = tCanvas.rect(zx, zy, (cellN - 1) * cellSize, (cellN - 1) * cellSize).attr({"fill": colorWhite, "opacity": 0});
//            var tLines = encodeLineList(startArray);
            $tryit.find(".tryit-canvas").mouseenter(function (e) {
                if (tooltip) {
                    return false;
                }
                var $tooltip = $tryit.find(".tryit-canvas .tooltip");
                $tooltip.fadeIn(1000);
                setTimeout(function () {
                    $tooltip.fadeOut(1000);
                }, 2000);
                tooltip = true;
            });
            activeRect.toFront();

            activeRect.click(function (e) {
                var x = (e.offsetX || e.layerX) - zx;
                var y = (e.offsetY || e.layerY) - zy;
                var cx = x % cellSize;
                var cy = y % cellSize;
                var row = Math.floor(y / cellSize);
                var col = Math.floor(x / cellSize);
                var mark = row * 4 + col + 1;
                var l1 = mark * 100 + mark + 1;
                var l2 = (mark + 1) * 100 + mark + 5;
                var l3 = mark * 100 + mark + 4;
                var l4 = (mark + 4) * 100 + mark + 5;
                var line;
                if (cx-cy >= 0) {
                    if (cx+cy-cellSize <= 0) {
                        line = l1;
                    }
                    else {
                        line = l2;
                    }
                }
                else {
                    if (cx+cy-cellSize <= 0) {
                        line = l3;
                    }
                    else {
                        line = l4;
                    }
                }
                if (line in tLinesDict){
                    tLinesDict[line].remove();
                    delete tLinesDict[line];
                }
                else {
                    var l = decodeLine(line);
                    tLinesDict[line] = tCanvas.path(createLinePath(
                        tDotSet[l[0] - 1].attr("cx"),
                        tDotSet[l[0] - 1].attr("cy"),
                        tDotSet[l[1] - 1].attr("cx"),
                        tDotSet[l[1] - 1].attr("cy")
                    )).attr(attrLine);
                }
            });
            $tryit.find('.bn-check').click(function (e) {
                var data = decodeLinesDict(tLinesDict);
                this_e.sendToConsoleCheckiO(data);
                e.stopPropagation();
                return false;
            });

        });

        var colorOrange4 = "#F0801A";
        var colorOrange3 = "#FA8F00";
        var colorOrange2 = "#FAA600";
        var colorOrange1 = "#FABA00";

        var colorBlue4 = "#294270";
        var colorBlue3 = "#006CA9";
        var colorBlue2 = "#65A1CF";
        var colorBlue1 = "#8FC7ED";

        var colorGrey4 = "#737370";
        var colorGrey3 = "#9D9E9E";
        var colorGrey2 = "#C5C6C6";
        var colorGrey1 = "#EBEDED";

        var colorWhite = "#FFFFFF";
        //Your Additional functions or objects inside scope
        //
        //
        //


    }
);
