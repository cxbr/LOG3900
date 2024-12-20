export const options = {
    management: { routeOne: '/game-management', btnOne: '' },
    selection: { routeOne: '/game', btnOne: '' },
};

export enum PageKeys {
    Management = 'management',
    Selection = 'selection',
}

export const slideConfig = {
    slidesToShow: 2,
    slidesToScroll: 2,
    lazyLoad: 'ondemand',
    cssEase: 'linear',
    dots: true,
    appendArrows: 'ngx-slick-carousel',
    infinite: false,
};
