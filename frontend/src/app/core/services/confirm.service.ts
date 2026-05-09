import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmRequest {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
    private requestSubject = new Subject<ConfirmRequest>();
    request$ = this.requestSubject.asObservable();

    ask(req: ConfirmRequest) {
        this.requestSubject.next(req);
    }
}
