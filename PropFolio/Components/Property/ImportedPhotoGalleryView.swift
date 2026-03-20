//
//  ImportedPhotoGalleryView.swift
//  PropFolio
//
//  Horizontal scrolling gallery of imported property photos. Native scroll and aspect ratio.
//

import SwiftUI

struct ImportedPhotoGalleryView: View {
    @Environment(\.appTheme) private var theme
    let photoURLs: [URL]
    var cornerRadius: CGFloat = AppRadius.l
    var itemHeight: CGFloat = 200

    var body: some View {
        if photoURLs.isEmpty {
            emptyView
        } else {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.s) {
                    ForEach(Array(photoURLs.enumerated()), id: \.offset) { _, url in
                        photoCell(url: url)
                    }
                }
                .padding(.horizontal, AppSpacing.m)
            }
            .frame(height: itemHeight + AppSpacing.s)
        }
    }

    private var emptyView: some View {
        HStack(spacing: AppSpacing.s) {
            Image(systemName: "photo.on.rectangle.angled")
                .font(.system(size: 32))
                .foregroundColor(theme.textTertiary)
            Text("No photos imported")
                .font(AppTypography.subheadline)
                .foregroundColor(theme.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .frame(height: itemHeight)
        .background(
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(theme.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: cornerRadius)
                .stroke(theme.border, lineWidth: 0.5)
        )
        .padding(.horizontal, AppSpacing.m)
    }

    private func photoCell(url: URL) -> some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .empty:
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(theme.surface)
                    .overlay(ProgressView().tint(theme.primary))
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            case .failure:
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(theme.surface)
                    .overlay(
                        Image(systemName: "photo")
                            .font(.system(size: 28))
                            .foregroundColor(theme.textTertiary)
                    )
            @unknown default:
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(theme.surface)
            }
        }
        .frame(width: itemHeight * 4 / 3, height: itemHeight)
        .clipped()
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
    }
}

#Preview("Gallery with URLs") {
    ImportedPhotoGalleryView(
        photoURLs: [URL(string: "https://picsum.photos/400/300")!]
    )
    .appThemeFromColorScheme()
}

#Preview("Gallery empty") {
    ImportedPhotoGalleryView(photoURLs: [])
        .appThemeFromColorScheme()
}
