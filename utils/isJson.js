export default function(input) {
    try {
        return JSON.parse(input) && true;
    }
    catch(_) {
        return false;
    }
}
