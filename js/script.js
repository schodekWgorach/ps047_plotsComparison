/**
 * Główna klasa aplikacji do porównywania plików txt
 */
class FileComparator {
    constructor() {
        this.file1Data = [];
        this.file2Data = [];
        this.comparisonResult = null;
        this.initializeEventListeners();
    }

    /**
     * Inicjalizuje nasłuchiwanie zdarzeń
     */
    initializeEventListeners() {
        const file1Input = document.getElementById('file1');
        const file2Input = document.getElementById('file2');
        const compareBtn = document.getElementById('compareBtn');
        if (!compareBtn) {
            console.error('Button with ID "compareBtn" not found.');
            return;
        }
        const exportBtn = document.getElementById('exportBtn');

        // Nasłuchiwanie na zmiany w plikach
        file1Input.addEventListener('change', (e) => this.handleFileSelect(e, 1));
        file2Input.addEventListener('change', (e) => this.handleFileSelect(e, 2));

        // Przycisk porównywania
        compareBtn.addEventListener('click', () => this.compareFiles());

        // Przycisk eksportu
        exportBtn.addEventListener('click', () => this.exportResults());
    }

    /**
     * Obsługuje wybór pliku
     * @param {Event} event - Zdarzenie zmiany pliku
     * @param {number} fileNum - Numer pliku (1 lub 2)
     */
    async handleFileSelect(event, fileNum) {
        const file = event.target.files[0];
        const fileInfo = document.getElementById(`file${fileNum}-info`);
        
        if (file) {
            try {
                fileInfo.textContent = `Wczytywanie...`;
                const data = await this.readTextFile(file);
                
                if (fileNum === 1) {
                    this.file1Data = this.parseTextData(data);
                } else {
                    this.file2Data = this.parseTextData(data);
                }
                
                fileInfo.textContent = `Załadowano: ${file.name} (${fileNum === 1 ? this.file1Data.length : this.file2Data.length} działek)`;
                this.updateCompareButton();
                
            } catch (error) {
                fileInfo.textContent = `Błąd: ${error.message}`;
                console.error('Błąd wczytywania pliku:', error);
            }
        } else {
            fileInfo.textContent = 'Nie wybrano pliku';
            if (fileNum === 1) {
                this.file1Data = [];
            } else {
                this.file2Data = [];
            }
            this.updateCompareButton();
        }
    }

    /**
     * Wczytuje zawartość pliku tekstowego
     * @param {File} file - Obiekt pliku
     * @returns {Promise<string>} - Zawartość pliku
     */
    readTextFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Plik nie został wybrany'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (e) => {
                const result = e.target.result;
                if (!result || result.trim().length === 0) {
                    reject(new Error('Plik jest pusty'));
                    return;
                }
                resolve(result);
            };
            
            reader.onerror = () => {
                reject(new Error('Błąd wczytywania pliku'));
            };

            reader.onabort = () => {
                reject(new Error('Wczytywanie pliku zostało przerwane'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Przetwarza surowe dane tekstowe na tablicę działek
     * @param {string} textData - Surowe dane tekstowe
     * @returns {string[]} - Tablica działek
     */
    parseTextData(textData) {
        // Dzielimy tekst na linie i usuwamy puste linie
        const lines = textData.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        // Usuwamy duplikaty i sortujemy
        return [...new Set(lines)].sort();
    }

    /**
     * Aktualizuje stan przycisku porównywania
     */
    updateCompareButton() {
        const compareBtn = document.getElementById('compareBtn');
        compareBtn.disabled = this.file1Data.length === 0 || this.file2Data.length === 0;
    }

    /**
     * Porównuje dwa pliki i generuje wyniki
     */
    async compareFiles() {
        const loading = document.getElementById('loading');
        const resultsSection = document.getElementById('resultsSection');
        
        try {
            // Pokaż ładowanie
            loading.style.display = 'block';
            resultsSection.style.display = 'none';
            
            // Symulacja opóźnienia dla lepszego UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Konwertuj tablice na Sety dla lepszej wydajności
            const set1 = new Set(this.file1Data);
            const set2 = new Set(this.file2Data);
            
            // Znajdź różnice
            const onlyInFile1 = this.file1Data.filter(item => !set2.has(item));
            const onlyInFile2 = this.file2Data.filter(item => !set1.has(item));
            const common = this.file1Data.filter(item => set2.has(item));
            
            // Zapisz wyniki
            this.comparisonResult = {
                file1Count: this.file1Data.length,
                file2Count: this.file2Data.length,
                onlyInFile1: onlyInFile1,
                onlyInFile2: onlyInFile2,
                common: common,
                onlyInFile1Count: onlyInFile1.length,
                onlyInFile2Count: onlyInFile2.length,
                commonCount: common.length
            };
            
            // Wyświetl wyniki
            this.displayResults();
            
        } catch (error) {
            console.error('Błąd porównywania:', error);
            alert('Wystąpił błąd podczas porównywania plików: ' + error.message);
        } finally {
            loading.style.display = 'none';
        }
    }

    /**
     * Wyświetla wyniki porównania
     */
    displayResults() {
        if (!this.comparisonResult) return;
        
        const resultsSection = document.getElementById('resultsSection');
        
        // Aktualizuj statystyki
        document.getElementById('file1Count').textContent = this.comparisonResult.file1Count;
        document.getElementById('file2Count').textContent = this.comparisonResult.file2Count;
        document.getElementById('onlyInFile1Count').textContent = this.comparisonResult.onlyInFile1Count;
        document.getElementById('onlyInFile2Count').textContent = this.comparisonResult.onlyInFile2Count;
        
        // Wyświetl listy różnic
        this.displayDifferenceList('onlyInFile1List', this.comparisonResult.onlyInFile1, 'only-in-file1');
        this.displayDifferenceList('onlyInFile2List', this.comparisonResult.onlyInFile2, 'only-in-file2');
        
        // Pokaż sekcję wyników
        resultsSection.style.display = 'block';
        
        // Przewiń do wyników
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Wyświetla listę różnic
     * @param {string} elementId - ID elementu docelowego
     * @param {string[]} items - Lista elementów do wyświetlenia
     * @param {string} cssClass - Klasa CSS dla elementów
     */
    displayDifferenceList(elementId, items, cssClass) {
        const container = document.getElementById(elementId);
        
        if (items.length === 0) {
            container.innerHTML = '<div class="diff-item">Brak różnic</div>';
        } else {
            container.innerHTML = items
                .map(item => `<div class="diff-item ${cssClass}">${this.escapeHtml(item)}</div>`)
                .join('');
        }
    }

    /**
     * Eksportuje wyniki do pliku txt
     */
    exportResults() {
        if (!this.comparisonResult) {
            alert('Brak wyników do eksportu');
            return;
        }
        
        const timestamp = new Date().toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        let content = `RAPORT PORÓWNANIA DZIAŁEK\n`;
        content += `Wygenerowano: ${timestamp}\n`;
        content += `${'='.repeat(50)}\n\n`;
        
        // Statystyki
        content += `STATYSTYKI:\n`;
        content += `1. Liczba działek w pliku 1: ${this.comparisonResult.file1Count}\n`;
        content += `2. Liczba działek w pliku 2: ${this.comparisonResult.file2Count}\n`;
        content += `3. Działki tylko w pliku 1: ${this.comparisonResult.onlyInFile1Count}\n`;
        content += `4. Działki tylko w pliku 2: ${this.comparisonResult.onlyInFile2Count}\n`;
        content += `5. Wspólne działki: ${this.comparisonResult.commonCount}\n\n`;
        
        // Działki tylko w pliku 1
        content += `${'='.repeat(50)}\n`;
        content += `DZIAŁKI KTÓRE ISTNIEJĄ W PLIKU 1 A NIE MA ICH W PLIKU 2:\n`;
        content += `${'='.repeat(50)}\n`;
        
        if (this.comparisonResult.onlyInFile1.length === 0) {
            content += `Brak działek unikalnych dla pliku 1\n\n`;
        } else {
            this.comparisonResult.onlyInFile1.forEach((item, index) => {
                content += `${index + 1}. ${item}\n`;
            });
            content += '\n';
        }
        
        // Działki tylko w pliku 2
        content += `${'='.repeat(50)}\n`;
        content += `DZIAŁKI KTÓRE ISTNIEJĄ W PLIKU 2 A NIE MA ICH W PLIKU 1:\n`;
        content += `${'='.repeat(50)}\n`;
        
        if (this.comparisonResult.onlyInFile2.length === 0) {
            content += `Brak działek unikalnych dla pliku 2\n\n`;
        } else {
            this.comparisonResult.onlyInFile2.forEach((item, index) => {
                content += `${index + 1}. ${item}\n`;
            });
            content += '\n';
        }
        
        // Wspólne działki
        content += `${'='.repeat(50)}\n`;
        content += `DZIAŁKI WSPÓLNE DLA OBU PLIKÓW:\n`;
        content += `${'='.repeat(50)}\n`;
        
        if (this.comparisonResult.common.length === 0) {
            content += `Brak wspólnych działek\n\n`;
        } else {
            this.comparisonResult.common.forEach((item, index) => {
                content += `${index + 1}. ${item}\n`;
            });
        }
        
        // Pobierz plik
        this.downloadFile(content, `porownanie_dzialek_${new Date().getTime()}.txt`);
    }

    /**
     * Pobiera plik tekstowy
     * @param {string} content - Zawartość pliku
     * @param {string} filename - Nazwa pliku
     */
    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Escapuje znaki HTML
     * @param {string} text - Tekst do escapowania
     * @returns {string} - Escapowany tekst
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicjalizacja aplikacji po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    new FileComparator();
});

// Funkcje pomocnicze dla dewelopera
window.FileComparatorUtils = {
    /**
     * Generuje przykładowe dane testowe
     */
    generateTestData: function() {
        const testFile1 = `DZIAŁKA 1/1
DZIAŁKA 2/3
DZIAŁKA 5/12
DZIAŁKA 8/7
DZIAŁKA 12/15
DZIAŁKA 15/20
DZIAŁKA 18/25`;
        
        const testFile2 = `DZIAŁKA 1/1
DZIAŁKA 3/5
DZIAŁKA 5/12
DZIAŁKA 9/10
DZIAŁKA 12/15
DZIAŁKA 20/30
DZIAŁKA 25/35`;
        
        console.log('Przykładowe dane dla pliku 1:', testFile1);
        console.log('Przykładowe dane dla pliku 2:', testFile2);
        
        return { testFile1, testFile2 };
    },
    
    /**
     * Testuje funkcjonalność porównywania
     */
    testComparison: function() {
        const { testFile1, testFile2 } = this.generateTestData();
        
        // Symulacja wczytywania plików
        const comparator = new FileComparator();
        comparator.file1Data = comparator.parseTextData(testFile1);
        comparator.file2Data = comparator.parseTextData(testFile2);
        
        console.log('Wynik porównania:', comparator.compareFiles());
        
        return comparator;
    }
};