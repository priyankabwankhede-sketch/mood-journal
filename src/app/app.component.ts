import { Component, signal, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import confetti from 'canvas-confetti';

interface Quote {
  content: string;
  author: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div [style.background]="bgColor()" class="container">
      <div class="blob blob1"></div>
      <div class="blob blob2"></div>

      <h1>{{ labels().title }}</h1>
      <p class="subtitle">{{ labels().subtitle }}</p>

      <div class="language-select">
        <label>{{ labels().language }}</label>
        <select [(ngModel)]="currentLang" (change)="translateQuote()">
          <option *ngFor="let lang of languages" [value]="lang.code">{{ lang.name }}</option>
        </select>
      </div>

      <div class="card" *ngIf="quote()" [style.background]="cardColor()" [class.fade-in]="fade()">
        <p class="quote">"{{ quote()?.content }}"</p>
        <p class="author">- {{ quote()?.author }}</p>
      </div>

      <div class="buttons">
        <button (click)="newQuote()">{{ labels().newQuote }}</button>
        <button (click)="saveFavorite()">❤️ {{ labels().favorite }}</button>
      </div>

      <div *ngIf="favorites().length > 0" class="favorites">
        <h3>{{ labels().favorites }}:</h3>
        <ul>
          <li *ngFor="let q of favorites()">{{ q.content }} - {{ q.author }}</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

.container {
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: background 1s;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

h1 {
  font-size: 3rem;
  background: linear-gradient(90deg,#ff6ec4,#7873f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  z-index: 2;
}

.subtitle {
  font-size: 1.2rem;
  margin-bottom: 20px;
  color: #fff;
  z-index: 2;
}

.language-select {
  margin-bottom: 20px;
  color: #fff;
  z-index: 2;
}

select {
  padding: 5px 10px;
  border-radius: 5px;
  border: none;
  font-size: 16px;
  cursor: pointer;
}

.card {
  padding: 30px;
  border-radius: 20px;
  max-width: 600px;
  box-shadow: 0 15px 25px rgba(0,0,0,0.3);
  margin-bottom: 20px;
  transition: transform 0.3s, background 0.5s, opacity 0.5s;
  opacity: 0;
  z-index: 2;
}

.fade-in {
  opacity: 1;
}

.card:hover {
  transform: scale(1.05);
}

.quote {
  font-size: 1.5rem;
  font-weight: 500;
  color: #333;
}

.author {
  margin-top: 10px;
  font-weight: 700;
  color: #555;
}

.buttons button {
  margin: 10px;
  padding: 12px 25px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: linear-gradient(45deg,#ff6ec4,#7873f5);
  color: white;
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 2;
}

.buttons button:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
}

.favorites {
  margin-top: 30px;
  text-align: left;
  max-width: 600px;
  color: #fff;
  z-index: 2;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(150px);
  opacity: 0.6;
  animation: float 20s infinite alternate;
  z-index: 1;
}

.blob1 {
  width: 300px;
  height: 300px;
  background: #ff6ec4;
  top: 10%;
  left: -10%;
}

.blob2 {
  width: 400px;
  height: 400px;
  background: #2575fc;
  bottom: 0;
  right: -15%;
}

@keyframes float {
  0% { transform: translateY(0) translateX(0); }
  100% { transform: translateY(-20px) translateX(20px); }
}
`] 
})
export class AppComponent {
  quote = signal<Quote | null>(null);
  favorites = signal<Quote[]>([]);
  bgColor = signal('#6a11cb');
  cardColor = signal('#fff');
  currentLang = 'en';
  fade = signal(true);

  private ngZone = inject(NgZone);
  private http = inject(HttpClient);

  languages = [
    { code:'en', name:'English' },
    { code:'es', name:'Spanish' },
    { code:'fr', name:'French' },
    { code:'de', name:'German' },
    { code:'hi', name:'Hindi' },
    { code:'zh', name:'Chinese' }
  ];

  labelTranslations: any = {
    en: { title:'Mood Journal', subtitle:'Get inspired, one quote at a time ✨', newQuote:'New Quote', favorite:'Favorite', favorites:'Favorites', language:'Language' },
    hi: { title:'मूड जर्नल', subtitle:'प्रेरित हों, एक समय में एक उद्धरण ✨', newQuote:'नया उद्धरण', favorite:'पसंदीदा', favorites:'पसंदीदा सूची', language:'भाषा' },
    es: { title:'Diario de Humor', subtitle:'Inspírate, una cita a la vez ✨', newQuote:'Nueva cita', favorite:'Favorito', favorites:'Favoritos', language:'Idioma' },
    fr: { title:'Journal d\'Humeur', subtitle:'Soyez inspiré, une citation à la fois ✨', newQuote:'Nouvelle citation', favorite:'Favori', favorites:'Favoris', language:'Langue' },
    de: { title:'Stimmungsjournal', subtitle:'Lass dich inspirieren, ein Zitat nach dem anderen ✨', newQuote:'Neues Zitat', favorite:'Favorit', favorites:'Favoriten', language:'Sprache' },
    zh: { title:'心情日记', subtitle:'逐条获得启发 ✨', newQuote:'新名言', favorite:'收藏', favorites:'收藏列表', language:'语言' }
  };

  labels = signal(this.labelTranslations.en);

  constructor() {
    this.newQuote();
  }

  newQuote() {
    this.fade.set(false);
    this.http.get<any[]>('https://api.allorigins.win/raw?url=https://type.fit/api/quotes').subscribe(res => {
      this.ngZone.run(() => {
        const random = res[Math.floor(Math.random() * res.length)];
        this.quote.set({ content: random.text, author: random.author || 'Unknown' });
        this.dynamicColors(random.text);
        this.fade.set(true);
        this.launchConfetti();
        if(this.currentLang !== 'en') this.translateQuote();
      });
    });
  }

  translateQuote() {
    const q = this.quote();
    if(!q) return;

    // Translate UI labels
    if(this.labelTranslations[this.currentLang]) {
      this.labels.set(this.labelTranslations[this.currentLang]);
    }

    if(this.currentLang === 'en') return;

    // Translate quote using Google Translate unofficial API via CORS proxy
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${this.currentLang}&dt=t&q=${encodeURIComponent(q.content)}`
    )}`;

    this.http.get<any>(url).subscribe((res: any) => {
      this.ngZone.run(() => {
        try {
          // Google API returns nested array: [[["translatedText","originalText",,,], ...], ...]
          const translated = res[0][0][0];
          this.quote.set({ ...q, content: translated });
        } catch {
          this.quote.set({ ...q, content: q.content });
        }
      });
    });
  }

  saveFavorite() {
    const q = this.quote();
    if(!q) return;
    const exists = this.favorites().some(f => f.content === q.content && f.author === q.author);
    if(!exists) this.favorites.set([...this.favorites(), q]);
  }


dynamicColors(text: string) {
    const positive = ['happy','love','success','joy','inspire'];
    const negative = ['sad','angry','pain','fail','hate'];
    let bg='#6a11cb', card='#fff';
    const lower = text.toLowerCase();
    if(positive.some(w => lower.includes(w))) { bg='#43cea2'; card='#e0f7fa'; }
    else if(negative.some(w => lower.includes(w))) { bg='#ff416c'; card='#fff0f0'; }
    else { const colors=['#6a11cb','#2575fc','#ffb347','#f7971e','#ff6ec4']; bg = colors[Math.floor(Math.random()*colors.length)]; card='#fff'; }
    this.bgColor.set(bg); this.cardColor.set(card);
  }


  launchConfetti() {
    confetti({ particleCount:100, spread:70, origin:{ y:0.6 } });
  }
}