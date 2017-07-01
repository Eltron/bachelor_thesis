const restServiceGET = '/pentaho/plugin/data-integrator/api/export?', // Адрес для GET-запроса REST-сервиса
    restServicePUT = '/pentaho/plugin/data-integrator/api/import', // Адрес для PUT-запроса REST-сервиса
    saiku = '/pentaho/plugin/saiku/api/admin/export/saiku/json?file=/home/admin/', // Адрес файла отчёта (без имени файла)
    filepath = '/pentaho/api/repo/files/:home:admin/children?filter=*.saiku'; // Адрес папки с отчётами
var json; // JSON-файл, хранящий данные отчёта.

// Функция получения списка файлов.
function getFiles() {
    var request = new XMLHttpRequest(),
        func = function f(e) {
        if (request.readyState === 4 && request.status === 200) {
            var parser = new DOMParser(),
                xmlDoc = parser.parseFromString(request.responseText, 'text/xml'),
                names = xmlDoc.getElementsByTagName('name');
                
            for (i of names) {
                $('#files').append('<option>'+i.childNodes[0].nodeValue+'</option>');
            }
        }
    };
        
    request.open('GET', filepath);
    request.onload = func;
    request.send();
}

// Метод отправки отчёта REST-сервису
function sendJSON() {
  var request = new XMLHttpRequest();
  request.open('PUT', restServicePUT);
  request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  request.send(JSON.stringify(json));
}

// Функция получения отчёта.
function getData(filename) {
    var rootpath = saiku + filename,
    request = new XMLHttpRequest();
    
    request.open('GET', rootpath);
    request.onload = function (e) {
        if (request.readyState === 4 && request.status === 200) {
            json = JSON.parse(request.responseText);
            sendJSON();
            createTable();
        }
    };
    request.send(); 
}

// Метод генерации URL
function generateURL() {
    var url = window.location.host + restService,
        rows = document.getElementById('data').rows;
        
    for (i = 0; i < getColHeadNum(); i++) {
        for (j = getRowHeadNum(); j < rows[i].cells.length; j++) {
            if (rows[i].cells[j].classList.contains('click')) {
                url += rows[i].cells[j].innerHTML + '|';
            }
        }
    }
    
    for (i = getColHeadNum()-1; i < rows.length; i++) {
        for (j = 0; j < getRowHeadNum(); j++) {
            if (rows[i].cells[j].classList.contains('click')) {
                url += rows[i].cells[j].innerHTML + '|';
            }
        }
    }
    
    url = url.slice(0, -1);
    
    document.getElementById('url').value = url;
}

// Функция генерации таблицы.
function createTable() {
    var table = document.getElementById('data'),
        tr,
        td,
        val = '',
        colspan = 1,
        same = false,
        cellset = json.cellset;
    
    for (i = 0; i < json.height; i++) {
        tr = table.insertRow();
        for (j = 0; j < json.width; j++) {
            if (cellset[i][j].type === 'DATA_CELL') {
                td = tr.insertCell();
                td.appendChild(document.createTextNode(cellset[i][j].value));
            }else if (cellset[i][j].value === 'null') {
                td = tr.insertCell();
                td.className = 'empty';
            } else if (cellset[i][j].value !== val) {
                if (colspan > 1) {
                    th.colSpan = colspan;
                    th.id = j-colspan+1;
                    colspan = 1;
                }
                val = cellset[i][j].value
                th = document.createElement('th');
                tr.appendChild(th);
                th.appendChild(document.createTextNode(val));
            } else {
                colspan++;
                if (j === json.width - 1) {
                    th.colSpan = colspan;
                    colspan = 1;
                }
            }
        }
    }
    
    for (j = getRowHeadNum()-2; j >= 0; j--) {
        for (i = getColHeadNum(); i < json.height-1; i++) { 
            if (cellset[i][j].value === cellset[i+1][j].value) {
                if (rowspan === 1) {
                    rowspan++;
                    continue;
                }
                rowspan++;
                if (i === json.height-2) {
                    table.rows[i+1].deleteCell(j);
                    table.rows[i-rowspan+2].cells[j].rowSpan = rowspan;
                    rowspan = 1;
                }
                table.rows[i].deleteCell(j);
            } else {
                if (rowspan !== 1) {
                    table.rows[i-rowspan+1].cells[j].rowSpan = rowspan;
                    table.rows[i].deleteCell(j);
                    rowspan = 1;
                }
            }
        }
    }
}

// Функция, которая делает заголовки кликальбельными.
// При клике на заголовок добавляется/убирается css класс click.
function setCellClick() {
    var func = function f() {
        this.classList.toggle('click');
    };
    $('#data').on('click', 'th', func);
}