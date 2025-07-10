export default function(input) {
    if(!input?.size) {
        return false;
    }
    if(!/^image\/(avif|jpeg|png|webp)$/.test(input?.mimetype)) {
        return false;
    }

    return true;
}
