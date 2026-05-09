import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppNotification {
    id: string;
    icon: string;
    color: string;
    title: string;
    text: string;
    time: string;
    read: boolean;
    timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private notifsSubject = new BehaviorSubject<AppNotification[]>([]);
    notifications$ = this.notifsSubject.asObservable();

    constructor() {
        this.load();
    }

    private load() {
        const stored = localStorage.getItem('maka_notifications');
        if (stored) {
            this.notifsSubject.next(JSON.parse(stored));
        }
    }

    private save(notifs: AppNotification[]) {
        localStorage.setItem('maka_notifications', JSON.stringify(notifs.slice(0, 50)));
        this.notifsSubject.next(notifs);
    }

    add(title: string, text: string, icon: string = 'fa-solid fa-bell', color: string = 'text-indigo-500') {
        const notifs = this.notifsSubject.value;
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const newNotif: AppNotification = {
            id: Math.random().toString(36).substring(2, 9),
            icon,
            color,
            title,
            text,
            time: timeStr,
            read: false,
            timestamp: Date.now()
        };
        this.save([newNotif, ...notifs]);
    }

    get unreadCount(): number {
        return this.notifsSubject.value.filter(n => !n.read).length;
    }

    markAllAsRead() {
        const notifs = this.notifsSubject.value.map(n => ({ ...n, read: true }));
        this.save(notifs);
    }

    clearAll() {
        this.save([]);
    }
}
