/**
 *  torrentz plugin for Movian
 *
 *  Copyright (C) 2015 Pisek
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 *  
 */


(function(plugin) {
    var PREFIX = plugin.getDescriptor().id;
    var LOGO = plugin.path + "logo.png";

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45', yellow = 'FFFF00';

    function colorStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function setPageHeader(page, title, image) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = LOGO;
            if (image) {
            	page.metadata.background = image;
            	page.metadata.backgroundAlpha = 0.3;
            }
        }
    }

    var service = plugin.createService(plugin.getDescriptor().title, PREFIX + ":start", "video", true, LOGO);

    var settings = plugin.createSettings(plugin.getDescriptor().title, LOGO, plugin.getDescriptor().synopsis);

    settings.createMultiOpt('sorting', "Sort results by",
    	[
	        ['search', 'Peers', true],
	        ['searchA', 'Date'],
	        ['searchN', 'Rating'],
	        ['searchS', 'Size']
        ], function(v) {
            service.sorting = v;
    	}
    );
    
    settings.createMultiOpt('torrentDownloadUrl', "Get torrent files from",
		[
	        ['magnet', 'Magnet links', true],
	        ['torcache', 'Torcache.net']
        ], function(v) {
        	switch (v) {
        		case 'magnet':
        			service.urlPrefix = "magnet:?xt=urn:btih:";
        			service.urlSuffix = "&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=http%3A%2F%2Ftracker.trackerfix.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker4.piratux.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.blackunicorn.xyz%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=http%3A%2F%2Ftracker.aletorrenty.pl%3A2710%2Fannounce&tr=udp%3A%2F%2Ftracker.pomf.se%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.me%3A2710%2Fannounce&tr=http%3A%2F%2Ftorrent.gresille.org%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Feddie4.nl%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&tr=http%3A%2F%2Ftracker.pubt.net%3A2710%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.istole.it%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=http%3A%2F%2Ftracker.yify-torrents.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337";
        		break;
        		case 'torcache':
        			service.urlPrefix = "torrent:browse:http://torcache.net/torrent/";
        			service.urlSuffix = ".torrent";
        		break;
        	}
    	}
    );
    
	settings.createString('torrentzUrl', "Use this torrentz.eu mirror (works with torrent2.eu and torrentzeu.to):",
		"https://torrentzeu.to",
		function(v) {
            service.torrentzUrl = v;
    	}
	);
    
    settings.createBool('useTransmission', "Use external Transmission service to download the torrent", false,
    	function(v) {
            service.useTransmission = v;
    	}
	);
	
	settings.createString('transmissionUrl', "External Transmission service url (no auth!)", 
		"http://192.168.0.1:9091/transmission/rpc/",
		function(v) {
            service.transmissionUrl = v;
    	}
	);

	function d(c) {
		print(JSON.stringify(c, null, 4));
	}
	
	function generateStatusText(sizeT) {
		var size = sizeT.split(' ');
        var sizeText = sizeT;
		if (size[1] == 'MB') {	//only MB and GB available
			if (size[0] > 2048) {
				sizeText = colorStr('It is almost IMPOSSIBLE to watch this movie in streaming mode\n(avg. dur. 120min = 7200seconds; '+size[0]+size[1]+' / 7200s = '+(Math.round((size[0]/7200) * 1000) / 1000)+size[1]+'/s constantly ! )', red);
			} else if ((size[0] < 2048) && (size[0] > 1024)) {
				sizeText = colorStr('There might be some buffering time - better have faster internet connection', yellow);
			} else {
				sizeText = colorStr('The movie should work OK on standatr internet connection', green);
			}
		} else {
			sizeText = colorStr('The movie should work OK on standatr internet connection', green);
		}
		return sizeText;
	}
	
	function resolveSortByString(sorting) {
		switch (sorting) {
		case 'searchA':
			return "Date";
		case 'searchN':
			return "Rating";
		case 'searchS':
			return "Size";
		default:
			return "Peers";
		}
	}

    function browseItems(page, search) {
        page.type = "directory";
        page.contents = "movies";
    	
    	var pageNumber = 0;
        page.entries = 0;

        //1 - btih, 2 - name, 3 - verified, 4 - old, 5 - size, 6 - seeds, 7 - peers
        var pattern = /<dl>\s*?<dt>\s*?<a href=[\"\']?\/(\S+?)[\"\']?\s?>\s*?(.*?)\s*?<\/a>[\S\s]*?<\/dt>\s*?<dd>\s*?<span[\S\s]*?>(.*?)<\/span>\s*?(?:<span[\S\s]*?>)+(.*?)(?:<\/span>)+\s*?<span[\S\s]*?>(.*?)<\/span>\s*?<span[\S\s]*?>([\d\,]+?)<\/span>\s*?<span[\S\s]*?>([\d\,]+?)<\/span>\s*?<\/dd>\s*?<\/dl>/igm;

        //number of pages
        var pagesPattern = /<\/span><a href="\/\S*?">Next &rsaquo; <\/a>/img;
        var maxPages = null;
        
        function loader() {
            page.loading = true;
            
            var url = service.torrentzUrl + '/'+service.sorting+'?f='+ (search ? search.replace(/\s/g, '+') : '&p='+pageNumber);
            d(url);
            var c = showtime.httpReq(url);

            var match = null;
            if (maxPages == null) {
            	match = pagesPattern.exec(c);
            	if (match != null) {
            		maxPages = match[1];
            	} else {
            		maxPages = 1;
            	}
            	d(maxPages);
            }
            
            while ((match = pattern.exec(c)) !== null) {
            	
            	var itemUrl = service.urlPrefix + match[1] + service.urlSuffix;
            	if (service.useTransmission) {
            		itemUrl = PREFIX + ":open:" + itemUrl;
            	}
            	
            	var statusText = generateStatusText(match[5]);
            	
                var item = page.appendItem(itemUrl, 'video', {
	                title: new showtime.RichText(match[2]),
	                description: new showtime.RichText(
	                	colorStr('Seeds: ', orange) + colorStr(match[6], green) +
	                	colorStr(' Peers: ', orange) + colorStr(match[7], red) +
	                	colorStr('\nSize: ', orange) + match[5] +
	                	colorStr(' Verified: ', orange) + match[3] +
	                	colorStr('\nUploaded: ', orange) + match[4] + ' ago' +
	                	colorStr('\nStatus: ', orange) + statusText
	                )
                });
                page.entries++;	//for searcher to work
                
            }
            
            page.loading = false;
			if (pageNumber == 0 && page.metadata) {	//only for first page - search results
               page.metadata.title += ' (' + page.entries;
               if (page.entries == 48) {
	               page.metadata.title += '+';
               }
               page.metadata.title += ')';
            }

            pageNumber++;
            return pageNumber < maxPages;	//max pages for torrentz.eu
        }
        
        loader();
        page.paginator = loader;
    }
    
    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        
        var sortedByString = resolveSortByString(service.sorting);
        
        page.appendItem("", "separator", {
            title: 'Sorted by: '+sortedByString
        });
        browseItems(page);
    });
    
    plugin.addURI(PREFIX + ":open:(.*)", function(page, url) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        page.type = "directory";
        
        page.appendItem("", "separator", {
            title: 'Open with:'
        });
        
        page.appendItem(url, "video", {
            title: 'Movian',
            description: 'Open torrent in internal client - stream the movie etc.'
        });
        page.appendItem(PREFIX + ":transmission:" + url, "video", {
            title: 'Add to Transmission',
            description: 'Torrent will be added and started to external transmission service'
        });
        
    });
    
    function transmissionTorrentAdd(url) {
    	
    	var init = showtime.httpReq(service.transmissionUrl, {noFail: true});
    	
    	var c = showtime.httpReq(service.transmissionUrl, {
    		noFail: true,
    		headers: {
				'X-Transmission-Session-Id': init.headers["X-Transmission-Session-Id"]
			},
			postdata: showtime.JSONEncode(
				{
					"method": "torrent-add",
					"arguments": {
						"paused": false,
						"filename": url
					}
				}
			)
    	});
    	
    	return c.statuscode;
    	
    }
    
    plugin.addURI(PREFIX + ":transmission:(.*)", function(page, url) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        page.type = "directory";
        
        var status = new showtime.RichText(colorStr('OK - torrent added and started on Tranasmission', green));
        var response = transmissionTorrentAdd(url);
        if (response != 200) {
        	status = new showtime.RichText(colorStr('ERROR: Something went wrong! (more info in logs)', red));
        }
        
        page.appendItem("", "separator", {
            title: status
        });
        
    });
    
    plugin.addSearcher(plugin.getDescriptor().title, LOGO, function(page, search) {
        browseItems(page, search);
    });
})(this);
