export default function(input) {
    try {
        return new URL(input) && true;
    }
    catch(_) {
        return false;
    }
}
