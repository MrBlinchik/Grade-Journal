const subjects = {
    'Информатика': 0,
    'Физика': 1,
    'Математика': 2,
    'Литература': 3,
    'Музыка': 4
};

// Функция для переключения между вкладками
function openTab(tabName) {
    const tabs = document.querySelectorAll('.content-section');
    tabs.forEach(tab => {
        tab.classList.toggle('hidden', tab.id !== tabName);
    });
}

openTab('home');

document.addEventListener('DOMContentLoaded', function() {
    // Функция для парсинга Excel данных
    function parseExcel(contents) {
        try {
            const workbook = XLSX.read(contents, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]]; 
            return XLSX.utils.sheet_to_json(sheet, { header: 1 });
        } catch (error) {
            console.error('Error parsing Excel file:', error);
            return [];
        }
    }

    // Функция для чтения файла и вывода данных на экран в виде таблицы
    function readFile(file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const contents = event.target.result;
            let data;
            if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                data = parseCSV(contents);
            } else if (file.name.endsWith('.xlsx')) {
                data = parseExcel(contents);
            }
            displayData(data);

            // Генерируем статистику по предметам из загруженных данных
            const subjectStatistics = generateSubjectStatistics(data);
            // Отображаем статистику по предметам
            displaySubjectStatistics(subjectStatistics);
            
            // Генерируем статистику по ученикам из загруженных данных
            const studentStatistics = generateStudentStatistics(data);
            // Отображаем статистику по ученикам
            displayStudentStatistics(studentStatistics);

            // Добавляем вызов функции для отображения графиков
            displayStatisticsGraph(subjectStatistics, studentStatistics);
        };

        if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
            reader.readAsText(file, 'UTF-8');
        } else if (file.name.endsWith('.xlsx')) {
            reader.readAsBinaryString(file);
        }
    }

    // Функция для парсинга CSV данных с учетом разделителя ;
    function parseCSV(contents) {
        return contents.split('\n').map(line => line.split(';'));
    }

    // Функция для вывода данных на экран в виде таблицы
    function displayData(data) {
        const table = document.createElement('table');
        const headers = data[0];
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const headerCell = document.createElement('th');
            headerCell.textContent = headerText;
            headerRow.appendChild(headerCell);
        });
        table.appendChild(headerRow);

        for (let i = 1; i < data.length; i++) {
            const rowData = data[i];
            const row = document.createElement('tr');
            rowData.forEach(cellData => {
                const cell = document.createElement('td');
                cell.textContent = cellData;
                row.appendChild(cell);
            });
            table.appendChild(row);
        }

        const dataPreview = document.getElementById('data-preview');
        dataPreview.innerHTML = '';
        dataPreview.appendChild(table);

        // Вызываем функцию для добавления кнопок редактирования и удаления
        setupEditAndDeleteButtons();
    }

    const uploadButton = document.getElementById('upload-button');
    uploadButton.addEventListener('click', function() {
        document.getElementById('file-input').click();
    });

    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            readFile(file);
        } else {
            alert('Пожалуйста, выберите файл для загрузки.');
        }
    });

    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            openTab(this.getAttribute('href').substring(1));
            event.preventDefault();
        });
    });
});

const downloadButton = document.getElementById('download-data-button');
downloadButton.addEventListener('click', downloadFiles);

function downloadFiles() {
    const table = document.querySelector('#data-preview table');
    const data = [];
    table.querySelectorAll('tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach(cell => {
            rowData.push(cell.textContent);
        });
        data.push(rowData.join(','));
    });

    const formats = ['csv', 'txt', 'xlsx'];
    formats.forEach(format => {
        let fileData;
        if (format === 'csv' || format === 'txt') {
            fileData = 'data:text/plain;charset=utf-8,' + encodeURIComponent(data.join('\n'));
        } else if (format === 'xlsx') {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(data.map(row => row.split(',')));
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
            const binaryData = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
            fileData = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + btoa(binaryData);
        }

        const downloadLink = document.createElement('a');
        downloadLink.href = fileData;
        downloadLink.download = 'data.' + format;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);

        downloadLink.click();

        document.body.removeChild(downloadLink);
    });

    alert('Файлы успешно скачаны.');
}

function setupEditAndDeleteButtons() {
    const table = document.querySelector('#data-preview table');
    if (!table) {
        console.error('Table not found');
        return;
    }
    table.querySelectorAll('tr').forEach((row, index) => {
        if (index === 0) {
            return;
        }
        const editButton = createButton('Редактировать', 'edit-btn', () => editStudent(index));
        const deleteButton = createButton('Удалить', 'delete-btn', () => deleteRow(index));
        const cell = document.createElement('td');
        cell.appendChild(editButton);
        cell.appendChild(deleteButton);
        row.appendChild(cell);
    });
}

function editStudent(rowIndex) {
    const table = document.querySelector('#data-preview table');
    const rowData = Array.from(table.rows[rowIndex].cells).map(cell => cell.textContent.trim());

    console.log(rowData);

    const fieldIds = ['student-name', 'student-class', 'grade-informatics', 'grade-physics', 'grade-math', 'grade-literature', 'grade-music'];
    rowData.forEach((data, index) => {
        const field = document.getElementById(fieldIds[index]);
        if (field) {
            field.value = data;
        } else {
            console.error(`Element with id ${fieldIds[index]} not found.`);
        }
    });

    openTab('edit');
}

function setupDeleteButtons() {
    document.querySelectorAll('.delete-btn').forEach((button, index) => {
        button.addEventListener('click', () => deleteRow(index));
    });
}

function deleteRow(rowIndex) {
    const table = document.querySelector('#data-preview table');
    if (!table) {
        console.error('Table not found');
        return;
    }
    table.deleteRow(rowIndex);
}

function createButton(text, className, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add(className);
    button.addEventListener('click', onClick);
    return button;
}

function addOrUpdateStudent() {
    const name = document.getElementById('student-name').value.trim();
    const studentClass = document.getElementById('student-class').value.trim();
    const grades = [
        document.getElementById('grade-informatics').value,
        document.getElementById('grade-physics').value,
        document.getElementById('grade-math').value,
        document.getElementById('grade-literature').value,
        document.getElementById('grade-music').value
    ];

    if (!name || !studentClass) {
        alert('Пожалуйста, заполните ФИО и класс ученика.');
        return;
    }

    const table = document.querySelector('#data-preview table');
    let existingRow = null;
    table.querySelectorAll('tr').forEach((row, index) => {
        if (index === 0) {
            return;
        }
        if (row.cells[0].textContent === name) {
            existingRow = row;
            return;
        }
    });

    if (existingRow) {
        existingRow.cells[1].textContent = studentClass;
        grades.forEach((grade, index) => {
            existingRow.cells[index + 2].textContent = grade;
        });
    } else {
        const newRow = table.insertRow(-1);
        newRow.insertCell(0).textContent = name;
        newRow.insertCell(1).textContent = studentClass;
        grades.forEach(grade => {
            newRow.insertCell().textContent = grade;
        });

        const editButton = createButton('Редактировать', 'edit-btn', () => editStudent(newRow.rowIndex));
        const deleteButton = createButton('Удалить', 'delete-btn', () => deleteRow(newRow.rowIndex));
        const actionCell = newRow.insertCell();
        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
    }

    document.getElementById('student-form').reset();
}

// Функция для вычисления среднего значения
function calculateAverage(grades) {
    const sum = grades.reduce((acc, grade) => acc + parseFloat(grade), 0);
    return (sum / grades.length) || 0;
}

// Функция для вычисления медианы
function calculateMedian(grades) {
    const sortedGrades = grades.slice().sort((a, b) => a - b);
    const mid = Math.floor(sortedGrades.length / 2);
    return sortedGrades.length % 2 !== 0
        ? sortedGrades[mid]
        : (parseFloat(sortedGrades[mid - 1]) + parseFloat(sortedGrades[mid])) / 2;
}

// Функция для подсчета количества учеников с определенной оценкой
function countStudentsWithGrade(grades, targetGrade) {
    return grades.filter(grade => parseFloat(grade) === targetGrade).length;
}

// Функция для вычисления процента учеников с определенной оценкой
function calculatePercentageWithGrade(grades, targetGrade) {
    const totalStudents = grades.length;
    const studentsWithGrade = countStudentsWithGrade(grades, targetGrade);
    return (studentsWithGrade / totalStudents) * 100;
}

// Функция для генерации статистики по предметам для каждого класса
function generateSubjectStatistics(data) {
    const subjectStatistics = {};

    data.forEach(row => {
        const studentClass = row[1];
        for (let i = 0; i < row.length - 2; i++) {
            const subject = Object.keys(subjects)[i];
            const grade = parseFloat(row[i + 2]);
            subjectStatistics[studentClass] ??= {};
            subjectStatistics[studentClass][subject] ??= { grades: [] };
            subjectStatistics[studentClass][subject].grades.push(grade);
        }
    });

    for (const studentClass in subjectStatistics) {
        const classStatistics = subjectStatistics[studentClass];
        for (const subject in classStatistics) {
            const grades = classStatistics[subject].grades;
            const average = calculateAverage(grades);
            const median = calculateMedian(grades);
            const gradeCounts = {};
            const gradePercentages = {};
            for (let grade = 2; grade <= 5; grade++) {
                gradeCounts[grade] = countStudentsWithGrade(grades, grade);
                gradePercentages[grade] = calculatePercentageWithGrade(grades, grade);
            }
            classStatistics[subject] = {
                average,
                median,
                gradeCounts,
                gradePercentages
            };
        }
    }

    return subjectStatistics;
}

// Функция для генерации статистики по каждому ученику для каждого предмета
function generateStudentStatistics(data) {
    const studentStatistics = {};

    data.forEach(row => {
        const studentName = row[0];
        const studentClass = row[1];
        const grades = row.slice(2).map(grade => parseFloat(grade));
        for (let i = 0; i < grades.length; i++) {
            const subject = Object.keys(subjects)[i];
            studentStatistics[studentName] ??= {};
            studentStatistics[studentName][subject] ??= {};
            const grade = grades[i];
            const gradePercentages = {};
            for (let gradeValue = 2; gradeValue <= 5; gradeValue++) {
                gradePercentages[gradeValue] = calculatePercentageWithGrade(grades, gradeValue);
            }
            studentStatistics[studentName][subject] = {
                grade,
                gradePercentages
            };
        }
    });
    return studentStatistics;
}

function displaySubjectStatistics(subjectStatistics) {
    const tableContainer = document.getElementById('subject-statistics-container');
    if (!tableContainer) {
        console.error('Ошибка: Элемент subject-statistics-container не найден на странице.');
        return;
    }
    tableContainer.innerHTML = ''; // Очистим контейнер перед добавлением новой таблицы

    for (const studentClass in subjectStatistics) {
        const classStatistics = subjectStatistics[studentClass];
        const classTable = document.createElement('table');
        classTable.innerHTML = `<caption>Статистика по классу ${studentClass}</caption>
                                <thead>
                                    <tr>
                                        <th>Предмет</th>
                                        <th>Средняя оценка</th>
                                        <th>Медиана</th>
                                        <th>Оценка 5</th>
                                        <th>Оценка 4</th>
                                        <th>Оценка 3</th>
                                        <th>Оценка 2</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>`;

        const tbody = classTable.querySelector('tbody');

        for (const subject in classStatistics) {
            const subjectData = classStatistics[subject];
            // Проверка наличия данных перед их обработкой
            if (subjectData.average && subjectData.median && subjectData.gradeCounts && subjectData.gradePercentages) {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${subject}</td>
                                 <td>${subjectData.average.toFixed(2)}</td>
                                 <td>${subjectData.median}</td>
                                 <td>${subjectData.gradeCounts[5]} (${subjectData.gradePercentages[5].toFixed(2)}%)</td>
                                 <td>${subjectData.gradeCounts[4]} (${subjectData.gradePercentages[4].toFixed(2)}%)</td>
                                 <td>${subjectData.gradeCounts[3]} (${subjectData.gradePercentages[3].toFixed(2)}%)</td>
                                 <td>${subjectData.gradeCounts[2]} (${subjectData.gradePercentages[2].toFixed(2)}%)</td>`;
                tbody.appendChild(row);
            }
        }

        tableContainer.appendChild(classTable);
    }
}

function displayStudentStatistics(studentStatistics) {
    const tableContainer = document.getElementById('student-statistics-container');
    if (!tableContainer) {
        console.error('Ошибка: Элемент student-statistics-container не найден на странице.');
        return;
    }
    tableContainer.innerHTML = ''; // Очистим контейнер перед добавлением новой таблицы

    const overallTable = document.createElement('table');
    const overallHeaderRow = document.createElement('tr');
    overallHeaderRow.innerHTML = `<th>Ученик</th>
                                  <th>Предмет</th>
                                  <th>Оценка</th>
                                  <th>Оценка 5 (%)</th>
                                  <th>Оценка 4 (%)</th>
                                  <th>Оценка 3 (%)</th>
                                  <th>Оценка 2 (%)</th>`;
    overallTable.appendChild(overallHeaderRow);

    for (const studentName in studentStatistics) {
        const studentData = studentStatistics[studentName];
        for (const subject in studentData) {
            const rowData = studentData[subject];
            // Проверка наличия данных перед их обработкой
            if (rowData.grade && rowData.gradePercentages) {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${studentName}</td>
                                 <td>${subject}</td>
                                 <td>${rowData.grade}</td>
                                 <td>${rowData.gradePercentages[5].toFixed(2)}</td>
                                 <td>${rowData.gradePercentages[4].toFixed(2)}</td>
                                 <td>${rowData.gradePercentages[3].toFixed(2)}</td>
                                 <td>${rowData.gradePercentages[2].toFixed(2)}</td>`;
                overallTable.appendChild(row);
            }
        }
    }

    tableContainer.appendChild(overallTable);
}

// Функция для создания графика классов
function createClassChart(subjects, subjectStatistics) {
    const classData = {
        labels: Object.keys(subjects),
        datasets: []
    };

    Object.keys(subjects).forEach(subject => {
        const dataset = {
            label: subject,
            data: Object.values(subjectStatistics).map(classStats => classStats[subject].average),
            backgroundColor: getRandomColor(),
            borderWidth: 1
        };

        classData.datasets.push(dataset);
    });

    const ctx = document.getElementById('class-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: classData,
        options: { scales: { y: { beginAtZero: true } } }
    });
}

// Функция для создания графика студентов
function createStudentChart(subjects, studentStatistics) {
    const studentData = {
        labels: Object.keys(studentStatistics),
        datasets: []
    };

    Object.keys(subjects).forEach(subject => {
        const dataset = {
            label: subject,
            data: Object.values(studentStatistics).map(studentStats => studentStats[subject].grade),
            backgroundColor: getRandomColor(),
            borderWidth: 1
        };

        studentData.datasets.push(dataset);
    });

    const ctx = document.getElementById('student-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: studentData,
        options: { scales: { y: { beginAtZero: true } } }
    });
}

// Функция для отображения статистики во вкладке "Статистика (график)"
function displayStatisticsGraph(subjectStatistics, studentStatistics) {
    createClassChart(subjects, subjectStatistics);
    createStudentChart(subjects, studentStatistics);
}

// Функция для генерации случайного цвета в формате RGB
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


















