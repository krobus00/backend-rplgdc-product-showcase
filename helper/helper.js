const msg = {
	success: 'Berhasil',
	failed: 'Gagal',
	server: 'Terjadi kesalahan pada server',
	unauthorized: 'Anda tidak diperbolehkan mengakses halaman ini',
	not_found: 'Halaman tidak ditemukan',
	noFile: 'Pilih file yang akan diupload',
	extNotAllow: 'File tidak diperbolehkan',
	fileLimit: 'Jumlah file melebihi batas maksimal',
	fileSize: 'Ukuran file terlalu besar',
	unkownForm: 'Form tidak dikenali',
	errValidation: 'Cek kembali',
}

/**
 *
 * @param {true|false} error true/false
 * @param {string} msg pesan
 * @param {Object} data data yang akan ditampilkan
 */
const response = (error, msg, data) => {
	return {error: error, msg: msg, data: data}
}
module.exports = {
	msg,
	response,
}
