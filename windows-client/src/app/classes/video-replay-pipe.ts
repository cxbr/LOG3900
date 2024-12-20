/* eslint-disable max-classes-per-file */
import { Pipe, PipeTransform } from '@angular/core';
import { Replay } from '@common/classes/replay';

@Pipe({
    name: 'publicFilter',
})
export class PublicFilterPipe implements PipeTransform {
    transform(items: Replay[], searchText: string): Replay[] {
        if (!items) return [];
        if (!searchText) return items;
        searchText = searchText.toLowerCase();
        return items.filter((it) => {
            return it.gameName.toLowerCase().includes(searchText) || it.creatorUsername?.toLowerCase().includes(searchText);
        });
    }
}

@Pipe({
    name: 'privateFilter',
})
export class PrivateFilterPipe implements PipeTransform {
    transform(items: Replay[], searchText: string, userId?: string): Replay[] {
        if (!items) return [];
        if (!userId) return [];
        if (searchText) {
            searchText = searchText.toLowerCase();
            return items.filter((it) => {
                return (
                    it.creator === userId &&
                    (it.gameName.toLowerCase().includes(searchText) || it.creatorUsername?.toLowerCase().includes(searchText))
                );
            });
        }
        return items.filter((it) => it.creator === userId);
    }
}
