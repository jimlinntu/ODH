class enen_MerriamWebster {
    constructor() {
        this.options = undefined;
        this.mw_base_url = 'https://www.merriam-webster.com/dictionary/';
        this.mw_audio_base_url = 'https://media.merriam-webster.com/audio/prons/en/us/mp3/';
        this.mw_audio_ext = ".mp3";
    }
    async displayName() {
        return 'Merriam Webster Dictionary';
    }

    async findTerm(word) {
        let results = this.findMWDict(word);
        return results;
    }

    T(node){
        if (!node)
            return '';
        else
            return node.innerText.trim();
    }

    clean_doc(doc){
        // remove Save Word
        let elements = doc.querySelectorAll(".save-to-list") || [];
        for (const e of elements) {
            e.remove();
        }
        return doc;
    }

    // Given the doc (DOM), search if there are pronunciations provided
    get_audios(doc){
        let audios = new Set(); // avoid duplicates
        const elements = doc.querySelectorAll(".entry-attr .play-pron");
        for (const e of elements) {
            const filename = e.getAttribute("data-file");
            const data_dir = e.getAttribute("data-dir");
            const data_lang = e.getAttribute("data-lang");
            // Only allow US style pronunciation
            if (filename && data_dir &&
                    data_lang && data_lang === "en_us" ) {
                // Ex. https://media.merriam-webster.com/audio/prons/en/us/mp3/t/test0001.mp3
                let url = this.mw_audio_base_url + data_dir + "/"+ filename + this.mw_audio_ext;
                audios.add(url);
            }
        }
        return Array.from(audios);
    }

    // Given the doc (DOM), get a standard (or deinflect) form of it (called expression here)
    get_expression(doc){
        return this.T(doc.querySelector(".hword"));
    }

    get_definitions(doc){
        /*
         * Typically, the definition section is structued like this:
         * <div class="row entry-header">...</div>
         * <div class="row entry-attr">...</div>
         * <div id="dictionary-entry-1">...</div>
         *
         * Or
         * <div class="row entry-header">...</div>
         * <div class="row headword-row">...</div>
         * <div id="dictionary-entry-1">...</div>
         */

        let definitions = [];
        let def_el = doc.querySelector("#definition-wrapper");
        if (!def_el) {
            return definitions;
        }
        let rows = def_el.children;
        if (rows.length === 0) {
            return definitions;
        }
        let divs = rows[0].children;
        if (divs.length === 0) {
            return definitions;
        }
        let content_divs = divs[0].children;
        if (content_divs.length === 0) {
            return definitions
        }
        // Remove unwanted divs
        let wanted_divs = [];
        for (const div of content_divs) {
            // Only leave: ".row" and "dictionary-entry-[0-9]+"
            if (div.className.includes("row") || div.id.includes("dictionary-entry-")) {
                wanted_divs.push(div);
            }
        }

        if (wanted_divs.length === 0) {
            return definitions;
        }

        // Convert it to html
        let definition = "";
        for (const div of wanted_divs) {
            definition += div.outerHTML;
        }
        definitions.push(definition);
        return definitions;
    }

    async findMWDict(word) {
        let notes = [];
        if (!word) return notes;

        let url = this.mw_base_url + encodeURIComponent(word);

        // Fetch the document of this word
        let doc = null;
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, 'text/html');
        } catch (err) {
            return [];
        }

        doc = this.clean_doc(doc);

        // Deinflected form (ex. tests -> test)
        let expression = this.get_expression(doc);
        let audios = this.get_audios(doc);

        let definitions = this.get_definitions(doc);

        notes.push({
            expression,
            audios,
            definitions
        });

        return notes;
    }
}
